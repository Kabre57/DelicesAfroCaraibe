import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/order.dart';
import '../services/order_service.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  static const routeName = '/orders';

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _service = OrderService();
  late Future<List<Order>> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.getOrdersForCurrentUser();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Commandes')),
      body: FutureBuilder<List<Order>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Erreur: ${snapshot.error}'));
          }
          final orders = snapshot.data ?? const <Order>[];
          if (orders.isEmpty) {
            return const Center(child: Text('Aucune commande'));
          }
          return ListView.builder(
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final o = orders[index];
              final createdAt = DateTime.tryParse(o.createdAt);
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: ListTile(
                  title: Text('Commande #${o.id.substring(0, o.id.length > 8 ? 8 : o.id.length)}'),
                  subtitle: Text(
                    '${o.status} • ${createdAt != null ? DateFormat('dd/MM/yyyy HH:mm').format(createdAt) : o.createdAt}',
                  ),
                  trailing: Text('${o.totalAmount.toStringAsFixed(2)} €'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
