import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { propertyService } from '../../services/api';
import favoriteService from '../../services/favoriteService';
import logger from '../../utils/logger';
import PropertyCard from '../../components/PropertyCard';
import SearchBar from '../../components/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const SearchResultsScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });

  const showCustomAlert = (title, message) => {
    setCustomAlert({ visible: true, title, message });
  };

  const hideCustomAlert = () => {
    setCustomAlert({ visible: false, title: '', message: '' });
  };

  // Helper: parse various price formats into Lakhs (number)
  const parsePriceToLakhs = (price) => {
    if (price == null) return null;
    const str = String(price).toLowerCase().trim();
    if (!str) return null;

    // Extract number
    const match = str.match(/([0-9]+(?:.[0-9]+)?)/);
    const num = match ? parseFloat(match[1]) : NaN;
    if (isNaN(num)) return null;

    // Detect unit
    if (/(crore|cr)/.test(str)) {
      return num * 100; // 1 Cr = 100 Lakhs
    }
    if (/(lakh|lac|l)/.test(str)) {
      return num; // Already in Lakhs
    }
    // Assume raw number is already Lakhs if reasonably small, else convert from absolute INR
    if (num > 1000) {
      // Likely absolute INR value, convert to Lakhs
      return num / 100000; // 1 Lakh = 100,000
    }
    return num;
  };

  // Core fetch + filter
  const fetchProperties = React.useCallback(async (query = '', incomingFilters = {}) => {
    try {
      setLoading(true);

      // Collect filters from route if not directly provided
      const {
        propertyType = '',
        city = '',
        minPrice,
        maxPrice,
        bedrooms = '',
        featured = false,
      } = Object.keys(incomingFilters).length ? incomingFilters : (route.params || {});

      // Get all properties and filter client-side
      const allProperties = await propertyService.getAllProperties();

      const q = (query || '').toLowerCase().trim();
      const minLakhs = typeof minPrice === 'number' ? minPrice : parsePriceToLakhs(minPrice);
      const maxLakhs = typeof maxPrice === 'number' ? maxPrice : parsePriceToLakhs(maxPrice);

      const data = allProperties.filter((property) => {
        // Text search
        if (q) {
          const searchableText = [
            property.title,
            property.description,
            property.city,
            property.location,
            property.address,
            property.property_type,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!searchableText.includes(q)) return false;
        }

        // Property type
        if (propertyType) {
          const pType = (property.property_type || '').toLowerCase();
          if (pType !== String(propertyType).toLowerCase()) return false;
        }

        // City
        if (city) {
          const pCity = (property.city || '').toLowerCase();
          if (pCity !== String(city).toLowerCase()) return false;
        }

        // Bedrooms (support different possible keys)
        if (bedrooms) {
          const bedVal =
            property.bedrooms ?? property.bhk ?? property.bedroom_count ?? '';
          const bedStr = String(bedVal).toLowerCase();
          const wanted = String(bedrooms).toLowerCase();
          if (wanted.includes('+')) {
            // e.g., 5+
            const min = parseInt(wanted, 10) || 5;
            const curr = parseInt(bedStr, 10) || 0;
            if (!(curr >= min)) return false;
          } else if (wanted) {
            if (bedStr !== wanted) return false;
          }
        }

        // Featured
        if (featured) {
          const isFeatured =
            property.is_featured === true ||
            property.is_featured === 1 ||
            String(property.is_featured).toLowerCase() === 'true' ||
            property.featured === true ||
            property.featured === 1;
          if (!isFeatured) return false;
        }

        // Price range in Lakhs
        if (minLakhs != null || maxLakhs != null) {
          const pPriceLakhs = parsePriceToLakhs(
            property.price ?? property.price_text ?? property.price_in_lakhs
          );
          if (pPriceLakhs == null) return false; // exclude unknown price when filtering by price
          if (minLakhs != null && pPriceLakhs < minLakhs) return false;
          if (maxLakhs != null && pPriceLakhs > maxLakhs) return false;
        }

        return true;
      });

      logger.info(
        'SearchResultsScreen',
        `Found ${data.length} properties for query: "${query}" with filters: ${JSON.stringify({ propertyType, city, minPrice, maxPrice, bedrooms, featured })}`
      );
      setProperties(data);
    } catch (error) {
      logger.error('SearchResultsScreen', 'Error fetching properties:', error);
      showCustomAlert('Error', 'Failed to load properties. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route.params]);

  const fetchFavorites = React.useCallback(async () => {
    if (!user) return;

    try {
      const userFavorites = await favoriteService.getFavorites();
      const favoritesMap = {};
      userFavorites.forEach((fav) => {
        if (fav.property_id) {
          favoritesMap[fav.property_id] = true;
        }
      });
      setFavorites(favoritesMap);
    } catch (error) {
      logger.error('SearchResultsScreen', 'Error fetching favorites:', error);
    }
  }, [user]);

  // Initialize with route params (query + filters)
  useEffect(() => {
    const initialQuery = route.params?.query || '';
    setSearchQuery(initialQuery);
    fetchProperties(initialQuery, route.params || {});
  }, [route.params, fetchProperties]);

  // Fetch favorites when user changes
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchFavorites();
      }
    }, [user, fetchFavorites])
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Keep previously applied filters from route
    fetchProperties(query, route.params || {});
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProperties(searchQuery, route.params || {});
    if (user) {
      fetchFavorites();
    }
  };

  const handlePropertyPress = (property) => {
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  const handleToggleFavorite = async (property) => {
    if (!user) {
      showCustomAlert('Sign In Required', 'Please sign in to save properties to favorites.');
      return;
    }

    try {
      const isFavorited = favorites[property.id];

      if (isFavorited) {
        await favoriteService.removeFavorite(property.id);
        setFavorites((prev) => {
          const updated = { ...prev };
          delete updated[property.id];
          return updated;
        });
      } else {
        await favoriteService.addFavorite(property.id);
        setFavorites((prev) => ({
          ...prev,
          [property.id]: true,
        }));
      }
    } catch (error) {
      logger.error('SearchResultsScreen', 'Error toggling favorite:', error);
      showCustomAlert('Error', 'Failed to update favorites. Please try again.');
    }
  };

  const renderProperty = ({ item }) => (
    <PropertyCard
      property={item}
      onPress={() => handlePropertyPress(item)}
      onToggleFavorite={() => handleToggleFavorite(item)}
      isFavorite={!!favorites[item.id]}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Properties Found' : 'Start Your Search'}
      </Text>
      <Text style={styles.emptyMessage}>
        {searchQuery
          ? `No properties match "${searchQuery}". Try adjusting your search terms.`
          : 'Enter a search term to find properties.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={handleSearch}
        placeholder="Search properties..."
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {loading ? 'Searching...' : `${properties.length} properties found`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a80f5" />
          <Text style={styles.loadingText}>Searching properties...</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4a80f5']} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Custom Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideCustomAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {customAlert.title}
            </Text>
            <Text style={styles.modalMessage}>
              {customAlert.message}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={hideCustomAlert}
            >
              <Text style={styles.modalButtonText}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 40, // Add top padding
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8, // Add bottom margin for better spacing
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    minWidth: 280,
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  modalButton: {
    backgroundColor: '#4a80f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchResultsScreen;