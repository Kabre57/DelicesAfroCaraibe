import '../config/api_config.dart';
import '../models/order.dart';
import 'api_client.dart';
import 'session_service.dart';

class OrderService {
  OrderService({
    ApiClient? apiClient,
    SessionService? sessionService,
  })  : _api = apiClient ?? const ApiClient(),
        _session = sessionService ?? SessionService();

  final ApiClient _api;
  final SessionService _session;

  Future<List<Order>> getOrdersForCurrentUser() async {
    final userId = await _session.getUserId();
    if (userId == null || userId.isEmpty) {
      return const [];
    }
    final token = await _session.getToken();
    final data = await _api.getJson(
      ApiConfig.buildUri(3004, '/api/orders/client/$userId'),
      token: token,
    ) as List<dynamic>;
    return data.whereType<Map<String, dynamic>>().map(Order.fromJson).toList(growable: false);
  }
}
