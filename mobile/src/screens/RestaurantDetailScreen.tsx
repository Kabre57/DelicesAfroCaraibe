import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface RestaurantDetail {
  id: string;
  name: string;
  cuisineType: string;
  address: string;
  phone: string;
  rating: number;
  menu: MenuItem[];
}

export default function RestaurantDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantDetails();
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      setRestaurant({
        id: id,
        name: 'Saveurs d\'Afrique',
        cuisineType: 'Africain',
        address: '123 Rue de Paris, 75001 Paris',
        phone: '01 23 45 67 89',
        rating: 4.5,
        menu: [
          {
            id: '1',
            name: 'Poulet DG',
            price: 15.99,
            description: 'Poulet braisé aux légumes',
          },
          {
            id: '2',
            name: 'Mafé',
            price: 12.99,
            description: 'Ragoût de viande à la sauce d\'arachide',
          },
          {
            id: '3',
            name: 'Alloco',
            price: 8.99,
            description: 'Bananes plantains frites',
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    console.log('Adding to cart:', item);
    alert(`${item.name} ajouté au panier!`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Restaurant non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.cuisineType}>{restaurant.cuisineType}</Text>
        <Text style={styles.rating}>⭐ {restaurant.rating}</Text>
        <Text style={styles.address}>{restaurant.address}</Text>
        <Text style={styles.phone}>{restaurant.phone}</Text>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Menu</Text>
        {restaurant.menu.map((item) => (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
              <Text style={styles.menuItemPrice}>{item.price.toFixed(2)} €</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addToCart(item)}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => navigation.navigate('Cart')}
      >
        <Text style={styles.cartButtonText}>Voir le panier</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cuisineType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#FF6B35',
  },
  menuSection: {
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cartButton: {
    backgroundColor: '#FF6B35',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
