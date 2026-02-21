import 'package:flutter/material.dart';

import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/home_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/restaurant_detail_screen.dart';
import 'screens/restaurants_screen.dart';

void main() {
  runApp(const DelicesApp());
}

class DelicesApp extends StatelessWidget {
  const DelicesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Delices Afro Caraibe',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFFF6B35)),
        useMaterial3: true,
      ),
      home: const MainTabsScreen(),
      routes: {
        LoginScreen.routeName: (_) => const LoginScreen(),
        RegisterScreen.routeName: (_) => const RegisterScreen(),
        RestaurantsScreen.routeName: (_) => const RestaurantsScreen(),
        OrdersScreen.routeName: (_) => const OrdersScreen(),
        ProfileScreen.routeName: (_) => const ProfileScreen(),
        CartScreen.routeName: (_) => const CartScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == RestaurantDetailScreen.routeName) {
          final id = settings.arguments as String?;
          return MaterialPageRoute(
            builder: (_) => RestaurantDetailScreen(restaurantId: id ?? ''),
          );
        }
        return null;
      },
    );
  }
}

class MainTabsScreen extends StatefulWidget {
  const MainTabsScreen({super.key});

  @override
  State<MainTabsScreen> createState() => _MainTabsScreenState();
}

class _MainTabsScreenState extends State<MainTabsScreen> {
  int _index = 0;

  final _pages = const [
    HomeScreen(),
    RestaurantsScreen(),
    OrdersScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Accueil'),
          NavigationDestination(icon: Icon(Icons.restaurant_outlined), label: 'Restaurants'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Commandes'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profil'),
        ],
      ),
    );
  }
}
