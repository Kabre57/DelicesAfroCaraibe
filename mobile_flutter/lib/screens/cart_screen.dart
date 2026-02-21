import 'package:flutter/material.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  static const routeName = '/cart';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Panier')),
      body: const Center(
        child: Text('Panier Flutter à connecter au state management (Provider/Riverpod).'),
      ),
    );
  }
}
