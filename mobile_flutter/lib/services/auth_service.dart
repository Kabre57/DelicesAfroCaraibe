import '../config/api_config.dart';
import '../models/user.dart';
import 'api_client.dart';
import 'session_service.dart';

class AuthService {
  AuthService({
    ApiClient? apiClient,
    SessionService? sessionService,
  })  : _api = apiClient ?? const ApiClient(),
        _session = sessionService ?? SessionService();

  final ApiClient _api;
  final SessionService _session;

  Future<User> login({
    required String email,
    required String password,
  }) async {
    final data = await _api.postJson(
      ApiConfig.buildUri(3001, '/api/auth/login'),
      body: {'email': email, 'password': password},
    ) as Map<String, dynamic>;

    final token = data['token']?.toString() ?? '';
    final userData = data['user'] as Map<String, dynamic>? ?? {};
    final user = User.fromJson(userData);
    await _session.saveSession(token: token, userId: user.id, role: user.role);
    return user;
  }

  Future<User> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phone,
    String role = 'CLIENT',
  }) async {
    final data = await _api.postJson(
      ApiConfig.buildUri(3001, '/api/auth/register'),
      body: {
        'email': email,
        'password': password,
        'role': role,
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'additionalData': <String, dynamic>{},
      },
    ) as Map<String, dynamic>;

    final token = data['token']?.toString() ?? '';
    final userData = data['user'] as Map<String, dynamic>? ?? {};
    final user = User.fromJson(userData);
    await _session.saveSession(token: token, userId: user.id, role: user.role);
    return user;
  }
}
