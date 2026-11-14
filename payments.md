# Payment Logic Architecture - Happy Delivery

## Executive Summary
This document outlines the comprehensive payment architecture for the Happy Delivery platform using **PayFast** as the sole payment gateway. All payments are **card-based** and **mandatory before order creation**. All payments flow into a single merchant account with transparent settlement tracking.

---

## 1. Payment Flow Overview

### 1.1 High-Level Payment Process
```
Customer → Cart Review → Payment Gateway (PayFast) → Payment Processing → Order Creation → Delivery
```

### 1.2 Payment Requirement
- **Pre-Order Payment Model**: Payment must be completed successfully before an order is created in the system.
- **No Pending Payment State**: Orders only exist after confirmed payment.
- **Immediate Confirmation**: Upon successful payment, order is instantly created and assigned to restaurant.

---

## 2. PayFast Integration Details

### 2.1 Account Structure
- **Merchant Account**: Single master account for all transactions
- **Settlement Account**: Direct bank transfer for all payouts
- **API Keys**: Merchant ID and Key stored in environment variables
- **Security**: All API calls use HTTPS; sensitive data encrypted in transit

### 2.2 Payment Methods Supported
- **Card Payments Only**: Visa, Mastercard, American Express
- **No Alternative Methods**: No EFT, wallet, or other payment options
- **3D Secure**: Enabled for enhanced fraud prevention (when applicable)

### 2.3 PayFast API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/process` | POST | Create payment request |
| `/api/query/{transaction_id}` | GET | Query transaction status |
| `/api/refund` | POST | Process refund |
| ITN (Instant Transaction Notification) | POST | Real-time payment confirmation webhook |

---

## 3. Payment States & Lifecycle

### 3.1 Payment State Machine
```
INITIATED → PENDING_PAYMENT → PAID → ORDER_CREATED → [REFUND_ELIGIBLE]
     ↓
  FAILED → RETRY_AVAILABLE (24h window)
     ↓
  ABANDONED → EXPIRED (after 48h)
```

### 3.2 State Definitions

| State | Description | Action |
|-------|-------------|--------|
| **INITIATED** | Payment session created, customer redirected to PayFast | Waiting for customer interaction |
| **PENDING_PAYMENT** | Awaiting PayFast confirmation | Customer on payment page |
| **PAID** | Payment confirmed by PayFast | Proceed to order creation |
| **FAILED** | Payment declined/failed | Offer retry or cancel |
| **ABANDONED** | Payment not completed within timeout | Customer exit without payment |
| **ORDER_CREATED** | Order successfully created post-payment | Order visible in app |
| **REFUND_INITIATED** | Refund request submitted | Processing refund to customer |
| **REFUNDED** | Refund completed | Funds returned to card |

---

## 4. Database Schema

### 4.1 Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(50) UNIQUE NOT NULL,  -- PayFast reference
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),  -- NULL until order created
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  payment_method VARCHAR(20) NOT NULL,  -- 'card'
  payment_status VARCHAR(20) NOT NULL,  -- INITIATED, PENDING_PAYMENT, PAID, FAILED, ABANDONED, REFUND_INITIATED, REFUNDED
  payment_gateway VARCHAR(20) NOT NULL,  -- 'payfast'
  gateway_response JSONB,  -- Full PayFast response
  customer_card_last_four VARCHAR(4),
  customer_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  expires_at TIMESTAMP,  -- 48 hours from creation
  updated_at TIMESTAMP DEFAULT NOW(),
  idempotency_key VARCHAR(255) UNIQUE,  -- Prevent duplicate charges
  CONSTRAINT check_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_customer_payments ON payments(customer_id);
CREATE INDEX idx_order_payment ON payments(order_id);
CREATE INDEX idx_transaction_status ON payments(payment_status);
CREATE INDEX idx_payment_expiry ON payments(expires_at);
```

### 4.2 Payment Refunds Table
```sql
CREATE TABLE payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  refund_amount DECIMAL(10, 2) NOT NULL,
  refund_reason VARCHAR(50) NOT NULL,  -- 'order_cancelled', 'order_failed', 'customer_request', 'delivery_issue'
  refund_status VARCHAR(20) NOT NULL,  -- INITIATED, PROCESSING, COMPLETED, FAILED
  gateway_refund_id VARCHAR(50),  -- PayFast refund reference
  gateway_response JSONB,
  initiated_by_user_type VARCHAR(20),  -- 'customer', 'restaurant', 'driver', 'admin'
  initiated_by_user_id UUID,
  refund_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  refunded_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_refund_amount_positive CHECK (refund_amount > 0)
);

CREATE INDEX idx_payment_refunds ON payment_refunds(payment_id);
CREATE INDEX idx_order_refunds ON payment_refunds(order_id);
CREATE INDEX idx_refund_status ON payment_refunds(refund_status);
```

### 4.3 Payment Settings Table
```sql
CREATE TABLE payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id VARCHAR(50) NOT NULL UNIQUE,
  merchant_key VARCHAR(255) NOT NULL,
  payfast_sandbox BOOLEAN DEFAULT false,
  refund_window_hours INT DEFAULT 72,  -- 3-day refund window
  auto_settle_enabled BOOLEAN DEFAULT true,
  settlement_frequency VARCHAR(20) DEFAULT 'daily',  -- 'immediate', 'daily', 'weekly'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Payment Processing Workflow

### 5.1 Initiating Payment (Customer Checkout)

**Frontend (Mobile App)**
1. Customer reviews cart
2. Enters delivery address & special instructions
3. Proceeds to payment
4. System generates idempotency key (UUID)
5. Redirect to PayFast payment page

**Backend Flow**
```
POST /api/payments/initiate
{
  customer_id: string,
  cart_items: CartItem[],
  delivery_address: Address,
  total_amount: number,
  restaurant_id: string
}

Response:
{
  payment_id: UUID,
  payfast_url: string,  // Redirect to PayFast
  transaction_id: string,
  idempotency_key: string
}
```

**Actions**:
- Create `payments` record with status `INITIATED`
- Generate idempotency key (prevents duplicate charges if request retried)
- Generate PayFast redirect URL with parameters
- Set expiry to 48 hours
- Return payment_id and PayFast URL to frontend

### 5.2 Payment Completion (PayFast Callback)

**PayFast Returns Customer to App**
1. After successful/failed payment, PayFast redirects to app
2. Frontend catches payment_id in URL
3. Calls backend to verify payment status
4. If PAID → Order created automatically
5. If FAILED → Show retry option

**Backend Verification**
```
GET /api/payments/{payment_id}/verify
Response:
{
  payment_status: 'PAID' | 'FAILED' | 'PENDING',
  order_id?: string,
  message: string
}
```

### 5.3 ITN (Instant Transaction Notification) - Webhook Handler

**Endpoint**: `POST /webhook/payfast/itn`

**PayFast sends confirmation** (asynchronous, in background)

```
{
  m_payment_id: string,
  pf_payment_id: string,
  payment_status: 'COMPLETE' | 'FAILED' | 'PENDING',
  amount_gross: number,
  amount_fee: number,
  amount_net: number,
  custom_int1: string,  // payment_id
  custom_str1: string,  // customer_id
  merchant_id: string,
  signature: string
}
```

**ITN Processing Steps**:
1. Validate PayFast signature (HMAC-MD5)
2. Fetch corresponding payment record
3. Update payment status
4. If PAID and order not created → Create order
5. Send SMS/push notification to customer
6. Log transaction details
7. Return 200 OK to PayFast

---

## 6. Order Creation Logic (Post-Payment)

### 6.1 Automatic Order Creation Trigger

**When**: Payment status changes to PAID
**Where**: Either ITN webhook or manual verification endpoint

**Order Creation Steps**:
```
1. Verify payment status = PAID
2. Lock cart (prevent further modifications)
3. Verify restaurant is accepting orders
4. Verify all menu items still available
5. Create order in DB
6. Assign order to restaurant queue
7. Notify restaurant via app/SMS
8. Notify customer with order confirmation
9. Update payment.order_id (link payment to order)
10. Schedule delivery time window
```

**Order Record**:
```
{
  id: UUID,
  customer_id: UUID,
  restaurant_id: UUID,
  payment_id: UUID,  -- Reference to payment
  order_status: 'CONFIRMED',  -- Status at creation
  items: OrderItem[],
  subtotal: number,
  delivery_fee: number,
  discount: number,
  tax: number,
  total: number,
  delivery_address: Address,
  estimated_delivery_time: timestamp,
  created_at: timestamp
}
```

### 6.2 Failure Scenarios

| Scenario | Action |
|----------|--------|
| Restaurant unavailable | Refund initiated, notify customer |
| Menu items out of stock | Refund initiated, notify customer |
| Cart timeout (>48h) | Payment expires, manual retry needed |
| Payment duplicate detected (idempotency) | Use cached response, prevent duplicate charge |

---

## 7. Refund Architecture

### 7.1 Refund Eligibility

**Refundable States**:
- Order CONFIRMED but not yet assigned to driver
- Order assigned but driver hasn't picked up food
- Order in transit (partial refund negotiation)

**Non-Refundable States**:
- Order completed and delivered
- Order older than 72 hours (configurable)
- Driver already picked up food (delivery proceeding)

### 7.2 Refund Initiators & Flows

#### 7.2.1 Customer-Initiated Refund
```
Customer clicks "Cancel Order" → Reason selection → Refund initiated

Reasons:
- Changed mind
- Restaurant taking too long
- Technical issue
- Other
```

**Flow**:
1. Create `payment_refunds` record with status `INITIATED`
2. Send approval request to restaurant (if order already confirmed)
3. If restaurant approves or timeout (5 min) → Auto-approve
4. Call PayFast refund API
5. Update refund status to `PROCESSING` then `COMPLETED`
6. Send notification to customer

#### 7.2.2 Restaurant-Initiated Refund
```
Restaurant marks order as "Unable to prepare" → Automatic refund

Scenario:
- Menu item suddenly unavailable
- Technical issue preventing preparation
- Excessive customer special requests not feasible
```

**Flow**:
1. Restaurant selects cancellation reason in app
2. Create `payment_refunds` record
3. Call PayFast refund API immediately (auto-approve)
4. Notify customer with reason
5. Suggest alternative restaurants/items
6. Log incident for analytics

#### 7.2.3 Driver-Initiated Refund
```
Driver reports issue → Refund initiated

Scenarios:
- Cannot locate customer address
- Customer not responding
- Safety concern
```

**Flow**:
1. Driver marks order for cancellation in app
2. Notify customer of issue
3. Provide 5-minute window to resolve
4. If not resolved → Auto-refund
5. Create support ticket for review

#### 7.2.4 Admin-Initiated Refund
```
Support team manually processes refund

Scenarios:
- Service failure (late delivery, wrong order, etc.)
- Customer complaint investigation
- System error compensation
```

**Flow**:
1. Admin dashboard → Select order
2. Enter refund amount (full or partial)
3. Select reason category
4. Add internal notes
5. Submit → Refund processed
6. Audit log created

### 7.3 Partial Refund Scenarios

**Full Refund**: 100% of payment returned
```
Reason: Order cancelled before preparation
Amount: Total charged
```

**Partial Refund**: Percentage-based refunds
```
Reason: Order cancelled after preparation started
Amount: 70% of total
Deduction: 30% preparation cost

Reason: Order cancelled by driver (near delivery)
Amount: 80% of total
Deduction: 20% for preparation + delivery initiation
```

### 7.4 Refund Processing via PayFast

**Refund API Call**:
```
POST https://api.payfast.co.za/api/refund
{
  merchant_id: string,
  merchant_key: string,
  pf_payment_id: string,  // PayFast transaction ID
  amount: number,  // Refund amount in ZAR
  signature: HMAC_MD5_HASH
}

Response:
{
  status: 'success' | 'error',
  pf_refund_id: string,
  amount: number,
  transaction_fees: number,
  timestamp: string
}
```

**Backend Processing**:
1. Validate refund is within 90-day window
2. Verify amount doesn't exceed original payment
3. Calculate PayFast fees for refund
4. Call PayFast API with HMAC signature
5. Update `payment_refunds.gateway_refund_id`
6. Update `payment_refunds.refund_status` → COMPLETED
7. Update `payments.payment_status` → REFUNDED (if full refund)
8. Update customer wallet/account credit
9. Trigger notification: "Refund processed, amount returned in 1-3 business days"

---

## 8. API Endpoints

### 8.1 Payment Endpoints

#### Initiate Payment
```
POST /api/v1/payments/initiate
Authorization: Bearer token
Content-Type: application/json

Request:
{
  customer_id: UUID,
  cart_id: UUID,
  delivery_address: {
    street: string,
    city: string,
    postal_code: string,
    lat: number,
    lng: number
  },
  delivery_notes: string,
  phone: string,
  email: string
}

Response (200):
{
  payment_id: UUID,
  payfast_url: string,
  expires_at: timestamp,
  idempotency_key: string
}

Response (400):
{
  error: 'Invalid cart' | 'Address validation failed' | 'Total amount mismatch'
}
```

#### Verify Payment Status
```
GET /api/v1/payments/{payment_id}/verify
Authorization: Bearer token

Response (200):
{
  payment_id: UUID,
  payment_status: 'PAID' | 'FAILED' | 'PENDING' | 'ABANDONED',
  order_id: UUID | null,
  transaction_id: string,
  amount: number,
  paid_at: timestamp | null,
  message: string
}
```

#### Get Payment Details
```
GET /api/v1/payments/{payment_id}
Authorization: Bearer token

Response (200):
{
  id: UUID,
  transaction_id: string,
  customer_id: UUID,
  order_id: UUID,
  amount: number,
  payment_status: string,
  payment_method: 'card',
  card_last_four: string,
  created_at: timestamp,
  paid_at: timestamp
}
```

#### List Customer Payments
```
GET /api/v1/customers/{customer_id}/payments?status=PAID&limit=10&offset=0
Authorization: Bearer token

Response (200):
{
  total: number,
  payments: Payment[]
}
```

### 8.2 Refund Endpoints

#### Initiate Refund
```
POST /api/v1/refunds/initiate
Authorization: Bearer token
Content-Type: application/json

Request:
{
  order_id: UUID,
  refund_reason: 'order_cancelled' | 'order_failed' | 'customer_request' | 'delivery_issue',
  refund_amount: number,  // If partial, otherwise full amount assumed
  customer_notes: string
}

Response (200):
{
  refund_id: UUID,
  refund_status: 'INITIATED',
  estimated_time: '1-3 business days',
  message: 'Refund request submitted successfully'
}

Response (400):
{
  error: 'Order not refundable' | 'Refund window expired' | 'Invalid amount'
}
```

#### Get Refund Status
```
GET /api/v1/refunds/{refund_id}
Authorization: Bearer token

Response (200):
{
  id: UUID,
  payment_id: UUID,
  order_id: UUID,
  refund_amount: number,
  refund_status: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  refund_reason: string,
  created_at: timestamp,
  refunded_at: timestamp
}
```

#### Admin Refund
```
POST /api/v1/admin/refunds
Authorization: Bearer admin_token
Content-Type: application/json

Request:
{
  order_id: UUID,
  refund_amount: number,
  reason: string,
  internal_notes: string
}

Response (200):
{
  refund_id: UUID,
  status: 'COMPLETED'
}
```

### 8.3 Webhook Endpoints

#### PayFast ITN Handler
```
POST /webhook/payfast/itn
Content-Type: application/x-www-form-urlencoded

PayFast sends form data containing:
m_payment_id, pf_payment_id, payment_status, amount_gross, 
amount_fee, amount_net, merchant_id, signature, etc.

Response (200):
{
  status: 'success'
}

Response (400):
{
  error: 'Signature verification failed' | 'Payment record not found'
}
```

---

## 9. Security Considerations

### 9.1 PCI DSS Compliance
- **No card data stored** in our servers (PayFast handles PCI)
- **No card data transmitted** to our backend (redirect model)
- **SSL/TLS** for all API communication
- **Environment variables** for merchant credentials (never in code)

### 9.2 Signature Verification
- All PayFast responses verified using HMAC-MD5 signature
- Merchant key stored securely in environment
- Prevent replay attacks with timestamp validation
- Signature validation before any state change

### 9.3 Idempotency & Duplicate Prevention
- Unique `idempotency_key` for each payment initiation
- Database unique constraint prevents duplicate transactions
- Cached responses for identical requests within 24-hour window
- Prevents accidental double-charging on network retry

### 9.4 Authorization & Rate Limiting
- All payment endpoints require authenticated user
- Rate limiting: Max 10 payment initiations per customer per minute
- Max 100 refund requests per day (system-wide)
- Admin refunds require elevated permissions

### 9.5 Audit Logging
- Every payment action logged with timestamp, user, and details
- Refund audit trail with initiator and approval chain
- Monthly reconciliation report: PayFast statement vs. DB records
- Alerts for failed refunds or suspicious transactions

---

## 10. Error Handling & Resilience

### 10.1 Common Error Scenarios

| Error | Cause | Resolution |
|-------|-------|-----------|
| Payment Gateway Timeout | PayFast slow/down | Retry after 30s; show message |
| Signature Mismatch | Data tampering/corruption | Log security alert; reject |
| Payment Already Exists | Duplicate request | Return cached response |
| Refund Amount Invalid | Exceeds original payment | Calculate max refund; reject |
| PayFast API Unreachable | Network/service outage | Queue refund; retry hourly |
| Order No Longer Refundable | 72h window expired | Return error; offer support |

### 10.2 Retry Logic
- **Automatic Retries**: PayFast API calls retry max 3 times (exponential backoff: 1s, 5s, 10s)
- **Manual Retries**: Customers can click "Retry Payment" within 24-hour window
- **Failed Refunds**: Attempt retry daily for 7 days; escalate to manual review

### 10.3 Circuit Breaker Pattern
- If PayFast API fails 5 consecutive times → Circuit open (60-second timeout)
- During circuit open → Show offline message; queue transactions
- Health check every 60 seconds to restore circuit

---

## 11. Settlement & Accounting

### 11.1 Payment Flow to Account
```
Customer Card → PayFast → Merchant Account (Master)
                           ↓
                    Settlement Account (Bank)
                    (Daily/Weekly transfers)
```

### 11.2 Fee Structure
- **PayFast Commission**: ~2.5% per transaction (configurable)
- **Delivery Platform Fee**: TBD (e.g., 5% order total)
- **Example**: 
  - Order total: R100
  - PayFast takes: R2.50
  - Platform takes: R5
  - Restaurant gets: R92.50 (after delivery fee)

### 11.3 Settlement Reconciliation
**Daily**:
- Run reconciliation report: DB payment records vs. PayFast statement
- Flag discrepancies for investigation
- Generate settlement summary email

**Weekly**:
- Detailed breakdown by restaurant
- Refund summary (amounts, reasons)
- Payment failure analysis

**Monthly**:
- Full audit report
- Variance analysis
- Tax/compliance reporting ready

---

## 12. Frontend Integration (Mobile App)

### 12.1 Payment Flow Screens

**Screen 1: Checkout Review**
```
- Cart summary
- Delivery address
- Special instructions
- Total amount (including fees)
- "Proceed to Payment" button
```

**Screen 2: PayFast Redirect**
```
- WebView component loads PayFast payment page
- User enters card details securely (on PayFast)
- 3D Secure prompt (if required)
```

**Screen 3: Payment Result**
```
Success:
- Order confirmation
- Order ID, estimated delivery time
- Restaurant details
- Live tracking available

Failure:
- Error message with reason
- Retry button
- Cancel order button
```

### 12.2 Payment State Management (Redux/Zustand)
```typescript
type PaymentState = {
  paymentId?: string,
  paymentStatus: 'IDLE' | 'LOADING' | 'PAID' | 'FAILED',
  orderId?: string,
  error?: string,
  
  actions: {
    initiatePayment(cartId, address): Promise<{url, paymentId}>
    verifyPaymentStatus(paymentId): Promise<PaymentStatus>
    clearPaymentState(): void
  }
}
```

### 12.3 Error States & UI Messages
```
FAILED: "Payment declined. Please try again or use a different card."
TIMEOUT: "Payment took too long. Your order was not created. Retry?"
ABANDONED: "You left the payment page. Your cart is still saved."
DUPLICATE: "This payment was already processed. Check your orders."
```

---

## 13. Admin Dashboard Features

### 13.1 Payment Management
- View all payments (filterable by status, date, customer, restaurant)
- Manual payment verification
- Initiate refunds with approval workflow
- View payment audit logs

### 13.2 Refund Management
- View refund requests (pending, approved, completed)
- Approve/reject refunds
- Edit refund amounts (partial refund)
- Add notes/comments
- Bulk refund processing

### 13.3 Reconciliation
- Daily settlement summary
- PayFast account reconciliation
- Generate settlement reports
- Export for accounting team

### 13.4 Alerts & Monitoring
- Failed payment alerts
- Refund abuse detection (>N% of orders)
- PayFast API down alert
- Suspicious transaction patterns

---

## 14. Testing Strategy

### 14.1 Unit Tests
- Payment state transitions
- Amount calculations (fees, taxes, discounts)
- Signature verification logic
- Refund eligibility rules

### 14.2 Integration Tests
- End-to-end payment flow (PayFast sandbox)
- Order creation post-payment
- Refund processing workflow
- ITN webhook handling

### 14.3 PayFast Sandbox Testing
- Use PayFast sandbox credentials
- Test cards provided by PayFast:
  - `4532 0151 2345 6789` (Success)
  - `5200 0123 4567 8901` (Decline)
- Test all payment scenarios and error cases

### 14.4 Load Testing
- Concurrent payment initiations
- High-volume refund processing
- API endpoint performance

---

## 15. Migration & Rollout Plan

### 15.1 Phase 1: Sandbox (Week 1)
- Set up PayFast sandbox account
- Implement all payment endpoints
- Test with internal users
- Document API behavior

### 15.2 Phase 2: Beta (Week 2-3)
- Enable payments for beta testers (5-10%)
- Monitor transaction logs for errors
- Gather feedback from testers
- Fix critical bugs

### 15.3 Phase 3: Production Rollout (Week 4)
- Switch to PayFast live credentials
- Enable for 50% of users
- Monitor payment success rate
- 24/7 support on standby
- Full rollout after 48 hours of stability

### 15.4 Post-Launch
- Daily reconciliation checks
- Weekly payment reports
- Monthly audit review
- Continuous monitoring for payment failures

---

## 16. Monitoring & Metrics

### 16.1 Key Metrics
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Payment Success Rate | >98% | <95% |
| Payment Processing Time | <5s | >10s |
| Refund Processing Time | <72h | >96h |
| PayFast API Uptime | >99.9% | <99% |
| ITN Webhook Response Time | <1s | >2s |

### 16.2 Dashboards
- Payment volume by day/week
- Payment success/failure breakdown
- Refund rate by reason
- Revenue per restaurant
- Average transaction amount

### 16.3 Alerts
- Payment failure spike (>5% fail rate)
- Refund abuse detected (>20% refund rate)
- PayFast API errors (5+ consecutive failures)
- Settlement discrepancy (>±1%)

---

## 17. Compliance & Legal

### 17.1 Terms & Conditions Updates
- Payment is non-refundable except in specified scenarios
- Refunds processed within 1-3 business days
- PayFast fees are non-refundable
- Restaurant cancellations are refundable in full

### 17.2 Privacy Policy
- Card data never stored by Happy Delivery
- Payment processing handled by PayFast (PCI-DSS certified)
- Transaction logs retained for 7 years (compliance)
- Customer payment history visible in app

### 17.3 POPIA Compliance (South Africa)
- Customer personal data minimized in payment flow
- PayFast responsible for PII protection
- Data retention policy aligned with regulations
- Right to access payment records

---

## 18. Future Enhancements

### 18.1 Potential Additions
- **Multiple Payment Methods**: EFT, SnapScan, PayPal (future)
- **Recurring Payments**: Subscription meal plans
- **Split Payments**: Multi-restaurant order split payment
- **Payment Plans**: Pay-in-installments for large orders
- **Buy Now, Pay Later**: BNPL integration (Takealot, Lay-Buy)
- **Coupons & Vouchers**: Payment discounting
- **Wallet Feature**: Pre-loaded balance for frequent customers
- **Analytics**: Heatmaps of payment decline reasons

### 18.2 Advanced Features
- **Fraud Detection**: ML-based anomaly detection
- **Dynamic Pricing**: Surge pricing during peak hours
- **Incentives**: Cash-back programs
- **B2B Payments**: Corporate account management

---

## 19. Support & Documentation

### 19.1 Customer Support
- FAQ: "Why was my payment declined?"
- "How do I get a refund?"
- "When will my refund arrive?"
- WhatsApp bot for payment inquiries

### 19.2 Developer Documentation
- API reference with cURL examples
- PayFast webhook signature verification code
- Payment state diagram
- Common integration patterns

### 19.3 Runbooks
- **Payment Failure Incident**: Debug steps
- **Refund Request**: Manual approval process
- **PayFast Outage**: Fallback procedures
- **Reconciliation Discrepancy**: Investigation steps

---

## 20. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE APP (Customer)                        │
│  [Cart] → [Checkout] → [Payment] → [Redirect to PayFast]        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │   PayFast Payment Page    │
            │   (Card Entry & Auth)     │
            └──────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │ (Success)                   │ (Failure)
        ▼                             ▼
   ┌─────────────┐            ┌─────────────────┐
   │  Redirect   │            │  Redirect with  │
   │   to App    │            │  Error Message  │
   │  (+ pay_id) │            │  (+ error_code) │
   └──────┬──────┘            └────────┬────────┘
          │                           │
          ▼                           ▼
   ┌─────────────────────────────────────────┐
   │     Backend Payment Verification        │
   │  GET /payments/{payment_id}/verify      │
   │  - Query PayFast API for status         │
   │  - Update payment record in DB          │
   │  - Create order (if PAID)               │
   └──────────────┬──────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │ (ITN also fires)  │
        ▼                   │
   ┌─────────────────┐      │
   │  Async Webhook  │      │
   │ POST /webhook   │      │
   │    /payfast     │      │
   │     /itn        │      │
   └────────┬────────┘      │
            │               │
            └──────┬────────┘
                   ▼
         ┌──────────────────┐
         │  Create Order    │
         │  Send SMS/Push   │
         │  Notify Rest.    │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Order Created   │
         │  & Confirmed     │
         └──────────────────┘

Refund Flow:
┌──────────────────┐
│  Refund Request  │
│  (Customer/Admin)│
└────────┬─────────┘
         ▼
┌──────────────────────┐
│  Eligibility Check   │
│  - 72h window?       │
│  - Can be refunded?  │
└────────┬─────────────┘
         ▼
┌────────────────────────┐
│  PayFast Refund API    │
│  Call (HMAC-signed)    │
└────────┬───────────────┘
         ▼
┌────────────────────────┐
│  Update Refund Status  │
│  Notify Customer       │
│  Return Funds (1-3d)   │
└────────────────────────┘
```

---

## Summary Checklist

- ✅ Payment Method: Card only (PayFast)
- ✅ Single Account: All payments to one merchant account
- ✅ Pre-Order Payment: Payment required before order creation
- ✅ Refund Logic: 72-hour window, multiple initiators, partial refunds
- ✅ Security: PCI DSS, signatures, idempotency, audit logs
- ✅ API Endpoints: Payment initiation, verification, refunds
- ✅ Database Schema: Payments, refunds, settings tables
- ✅ Monitoring: Metrics, alerts, reconciliation
- ✅ Testing: Unit, integration, sandbox tests
- ✅ Rollout Plan: Phased deployment
- ✅ Compliance: Terms, privacy, POPIA
- ✅ Documentation: API docs, runbooks, customer support

---

**Last Updated**: May 25, 2026
**Owner**: Development Team
**Status**: Ready for Implementation
