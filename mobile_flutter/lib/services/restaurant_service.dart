import '../config/api_config.dart';
import '../models/menu_item.dart';
import '../models/restaurant.dart';
import 'api_client.dart';

class RestaurantService {
  RestaurantService({ApiClient? apiClient}) : _api = apiClient ?? const ApiClient();

  final ApiClient _api;

  Future<List<Restaurant>> getRestaurants() async {
    final data = await _api.getJson(ApiConfig.buildUri(3003, '/api/restaurants')) as List<dynamic>;
    return data
        .whereType<Map<String, dynamic>>()
        .map(Restaurant.fromJson)
        .toList(growable: false);
  }

  Future<Restaurant> getRestaurantById(String id) async {
    final data = await _api.getJson(ApiConfig.buildUri(3003, '/api/restaurants/$id')) as Map<String, dynamic>;
    return Restaurant.fromJson(data);
  }

  Future<List<MenuItem>> getRestaurantMenu(String restaurantId) async {
    final data = await _api.getJson(
      ApiConfig.buildUri(3003, '/api/menu/restaurant/$restaurantId'),
    ) as List<dynamic>;
    return data.whereType<Map<String, dynamic>>().map(MenuItem.fromJson).toList(growable: false);
  }
}
