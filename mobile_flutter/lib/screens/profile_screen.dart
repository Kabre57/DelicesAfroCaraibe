import 'package:flutter/material.dart';

import '../services/session_service.dart';
import 'auth/login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static const routeName = '/profile';

  @override
  Widget build(BuildContext context) {
    final session = SessionService();
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Espace profil', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, LoginScreen.routeName),
              child: const Text('Se connecter'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () async {
                await session.clear();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Session supprimée')),
                  );
                }
              },
              child: const Text('Se déconnecter'),
            ),
          ],
        ),
      ),
    );
  }
}
