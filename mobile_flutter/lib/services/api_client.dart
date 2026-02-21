import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiClient {
  const ApiClient();

  Future<dynamic> getJson(
    Uri uri, {
    String? token,
  }) async {
    final response = await http.get(uri, headers: _headers(token));
    return _parseResponse(response);
  }

  Future<dynamic> postJson(
    Uri uri, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    final response = await http.post(
      uri,
      headers: _headers(token),
      body: jsonEncode(body ?? <String, dynamic>{}),
    );
    return _parseResponse(response);
  }

  Map<String, String> _headers(String? token) {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  dynamic _parseResponse(http.Response response) {
    final body = response.body.isEmpty ? '{}' : response.body;
    final parsed = jsonDecode(body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return parsed;
    }
    if (parsed is Map<String, dynamic>) {
      throw Exception(parsed['error']?.toString() ?? 'Request failed: ${response.statusCode}');
    }
    throw Exception('Request failed: ${response.statusCode}');
  }
}
