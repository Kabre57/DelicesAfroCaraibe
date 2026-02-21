class Restaurant {
  final String id;
  final String name;
  final String description;
  final String address;
  final String city;
  final String phone;
  final String cuisineType;
  final String? imageUrl;

  const Restaurant({
    required this.id,
    required this.name,
    required this.description,
    required this.address,
    required this.city,
    required this.phone,
    required this.cuisineType,
    required this.imageUrl,
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    return Restaurant(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      cuisineType: json['cuisineType']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString(),
    );
  }
}
