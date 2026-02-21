import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Accueil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Bienvenue sur Delices Afro Caraibe.\nDécouvrez la cuisine africaine et caribéenne.',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
