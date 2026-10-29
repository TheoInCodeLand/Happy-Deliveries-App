import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../common/Button';
import { colors } from '../../constants/colors';

interface MenuItemProps {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    discounted_price?: number;
    image_url?: string;
    category: string;
    tags: string[];
    ingredients: any[];
    customizations: any[];
    is_available: boolean;
  };
  restaurantId: string;
  onAddToCart: (cartItem: any) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, restaurantId, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    // This call now matches the interface definition above
    onAddToCart({
      ...item,
      quantity,
      specialInstructions,
      selectedOptions,
    });
    setModalVisible(false);
    setQuantity(1);
    setSpecialInstructions('');
    setSelectedOptions({});
  };

  const finalPrice = item.discounted_price || item.price;

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => {
          if (item.is_available) {
            router.push({
              pathname: '/(customer)/menu/[id]',
              params: { id: item.id, restaurantId }
            });
          }
        }}
        disabled={!item.is_available}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              {item.discounted_price ? (
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>R{item.price.toFixed(2)}</Text>
                  <Text style={styles.price}>R{finalPrice.toFixed(2)}</Text>
                </View>
              ) : (
                <Text style={styles.price}>R{finalPrice.toFixed(2)}</Text>
              )}
            </View>
            
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            
            {!item.is_available && (
              <Text style={styles.unavailableText}>Currently unavailable</Text>
            )}
          </View>
          
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="fast-food" size={30} color={colors.gray400} />
            </View>
          )}
        </View>
        
        {item.is_available && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Customization Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{item.name}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalDescription}>{item.description}</Text>
              
              {item.customizations && item.customizations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Customizations</Text>
                  {item.customizations.map((customization, index) => (
                    <View key={index} style={styles.optionGroup}>
                      <Text style={styles.optionLabel}>{customization.name}</Text>
                      <View style={styles.optionButtons}>
                        {customization.options.map((option: string, optionIndex: number) => (
                          <TouchableOpacity
                            key={optionIndex}
                            style={[
                              styles.optionButton,
                              selectedOptions[customization.name] === option && styles.optionButtonSelected,
                            ]}
                            onPress={() => setSelectedOptions(prev => ({
                              ...prev,
                              [customization.name]: option,
                            }))}
                          >
                            <Text style={[
                              styles.optionButtonText,
                              selectedOptions[customization.name] === option && styles.optionButtonTextSelected,
                            ]}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Special Instructions</Text>
                <TouchableOpacity 
                  style={styles.instructionsInput}
                  onPress={() => {
                    // In production, you'd open a text input modal
                  }}
                >
                  <Text style={styles.instructionsPlaceholder}>
                    {specialInstructions || 'Add note (extra sauce, no onions, etc.)'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.quantitySection}>
                <Text style={styles.sectionTitle}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={handleDecrement}
                  >
                    <Ionicons name="remove" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  
                  <Text style={styles.quantityText}>{quantity}</Text>
                  
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={handleIncrement}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>R{(finalPrice * quantity).toFixed(2)}</Text>
              </View>
              
              <Button
                title={`Add to Cart • R${(finalPrice * quantity).toFixed(2)}`}
                onPress={handleAddToCart}
                style={styles.addToCartButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unavailableText: {
    fontSize: 12,
    color: colors.error,
    fontStyle: 'italic',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholder: {
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  optionGroup: {
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionButtonTextSelected: {
    color: '#fff',
  },
  instructionsInput: {
    backgroundColor: colors.gray100,
    padding: 16,
    borderRadius: 8,
  },
  instructionsPlaceholder: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  quantitySection: {
    padding: 20,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 200,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addToCartButton: {
    width: '100%',
  },
});

export default MenuItem;