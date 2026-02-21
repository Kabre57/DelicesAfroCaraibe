class ApiConfig {
  static const String host = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2',
  );

  static Uri buildUri(int port, String path) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$host:$port$normalizedPath');
  }
}
