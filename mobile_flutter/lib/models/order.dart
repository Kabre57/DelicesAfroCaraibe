class Order {
  final String id;
  final String status;
  final double totalAmount;
  final String createdAt;
  final String deliveryAddress;
  final String deliveryCity;

  const Order({
    required this.id,
    required this.status,
    required this.totalAmount,
    required this.createdAt,
    required this.deliveryAddress,
    required this.deliveryCity,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      createdAt: json['createdAt']?.toString() ?? '',
      deliveryAddress: json['deliveryAddress']?.toString() ?? '',
      deliveryCity: json['deliveryCity']?.toString() ?? '',
    );
  }
}
