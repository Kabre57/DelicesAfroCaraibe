class User {
  final String id;
  final String email;
  final String role;
  final String firstName;
  final String lastName;
  final String phone;

  const User({
    required this.id,
    required this.email,
    required this.role,
    required this.firstName,
    required this.lastName,
    required this.phone,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      firstName: json['firstName']?.toString() ?? '',
      lastName: json['lastName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
    );
  }
}
