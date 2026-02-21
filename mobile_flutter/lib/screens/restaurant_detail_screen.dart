import 'package:flutter/material.dart';

import '../models/menu_item.dart';
import '../models/restaurant.dart';
import '../services/restaurant_service.dart';

class RestaurantDetailScreen extends StatefulWidget {
  const RestaurantDetailScreen({super.key, required this.restaurantId});

  static const routeName = '/restaurant-detail';
  final String restaurantId;

  @override
  State<RestaurantDetailScreen> createState() => _RestaurantDetailScreenState();
}

class _RestaurantDetailScreenState extends State<RestaurantDetailScreen> {
  final _service = RestaurantService();
  late Future<(Restaurant, List<MenuItem>)> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<(Restaurant, List<MenuItem>)> _load() async {
    final restaurant = await _service.getRestaurantById(widget.restaurantId);
    final menu = await _service.getRestaurantMenu(widget.restaurantId);
    return (restaurant, menu);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Restaurant')),
      body: FutureBuilder<(Restaurant, List<MenuItem>)>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Erreur: ${snapshot.error}'));
          }
          final data = snapshot.data;
          if (data == null) {
            return const Center(child: Text('Restaurant introuvable'));
          }
          final restaurant = data.$1;
          final menu = data.$2;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(restaurant.name, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text('${restaurant.cuisineType} • ${restaurant.city}'),
              const SizedBox(height: 8),
              Text(restaurant.description),
              const SizedBox(height: 16),
              const Text('Menu', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...menu.map(
                (item) => Card(
                  child: ListTile(
                    title: Text(item.name),
                    subtitle: Text(item.description),
                    trailing: Text('${item.price.toStringAsFixed(2)} €'),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
