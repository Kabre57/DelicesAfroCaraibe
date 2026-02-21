import 'package:flutter/material.dart';

import '../models/restaurant.dart';
import '../services/restaurant_service.dart';
import 'restaurant_detail_screen.dart';

class RestaurantsScreen extends StatefulWidget {
  const RestaurantsScreen({super.key});

  static const routeName = '/restaurants';

  @override
  State<RestaurantsScreen> createState() => _RestaurantsScreenState();
}

class _RestaurantsScreenState extends State<RestaurantsScreen> {
  final _service = RestaurantService();
  late Future<List<Restaurant>> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.getRestaurants();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Restaurants')),
      body: FutureBuilder<List<Restaurant>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Erreur: ${snapshot.error}'));
          }
          final restaurants = snapshot.data ?? const <Restaurant>[];
          if (restaurants.isEmpty) {
            return const Center(child: Text('Aucun restaurant disponible'));
          }
          return ListView.separated(
            itemCount: restaurants.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final r = restaurants[index];
              return ListTile(
                title: Text(r.name),
                subtitle: Text('${r.cuisineType} • ${r.city}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.pushNamed(
                    context,
                    RestaurantDetailScreen.routeName,
                    arguments: r.id,
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
