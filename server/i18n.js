// Backend i18n configuration for API messages and error messages
const translations = {
  de: {
    // Database errors
    'database_error': 'Datenbankfehler',
    'server_error_registration': 'Serverfehler bei der Registrierung',
    'server_error_login': 'Serverfehler bei der Anmeldung',
    'user_not_found': 'Benutzer nicht gefunden',
    
    // Authentication errors
    'user_already_exists': 'Benutzer existiert bereits',
    'invalid_credentials': 'Ungültige Anmeldedaten',
    'access_denied': 'Zugriff verweigert',
    'invalid_token': 'Ungültiger oder abgelaufener Token',
    'no_permission': 'Keine Berechtigung für diese Aktion',
    'user_creation_error': 'Fehler beim Erstellen des Benutzers',
    'server_error_logout': 'Serverfehler bei der Abmeldung',
    'user_registration_pending': 'Registrierung erfolgreich. Bitte warten Sie auf die Freigabe durch den Administrator.',
    'account_pending_approval': 'Ihr Konto wartet noch auf die Freigabe durch den Administrator.',
    'insufficient_permissions': 'Unzureichende Berechtigungen für diese Aktion',
    
    // Study errors
    'study_not_found': 'Studie nicht gefunden',
    'study_not_found_or_not_published': 'Studie nicht gefunden oder nicht veröffentlicht',
    
    // File upload errors
    'no_audio_file_uploaded': 'Keine Audio-Datei hochgeladen',
    'only_audio_files_allowed': 'Nur Audio-Dateien sind erlaubt!',
    'could_not_read_audio_directory': 'Audio-Verzeichnis konnte nicht gelesen werden',
    'could_not_delete_file': 'Datei konnte nicht gelöscht werden',
    
    // Success messages
    'study_deleted_successfully': 'Studie erfolgreich gelöscht',
    'study_withdrawn': 'Studie zurückgezogen',
    'file_deleted_successfully': 'Datei erfolgreich gelöscht',
    'user_created_successfully': 'Benutzer erfolgreich erstellt',
    'login_successful': 'Anmeldung erfolgreich',
    'logout_successful': 'Abmeldung erfolgreich',
    'user_approved_successfully': 'Benutzer erfolgreich freigegeben',
    'user_rejected_successfully': 'Benutzerregistrierung erfolgreich abgelehnt',
    
    // General errors
    'internal_server_error': 'Interner Serverfehler',
    'bad_request': 'Ungültige Anfrage',
    'not_found': 'Nicht gefunden',
    'forbidden': 'Zugriff verboten'
  },
  en: {
    // Database errors
    'database_error': 'Database error',
    'server_error_registration': 'Server error during registration',
    'server_error_login': 'Server error during login',
    'user_not_found': 'User not found',
    
    // Authentication errors
    'user_already_exists': 'User already exists',
    'invalid_credentials': 'Invalid credentials',
    'access_denied': 'Access denied',
    'invalid_token': 'Invalid or expired token',
    'no_permission': 'No permission for this action',
    'user_creation_error': 'Error creating user',
    'server_error_logout': 'Server error during logout',
    'user_registration_pending': 'Registration successful. Please wait for admin approval.',
    'account_pending_approval': 'Your account is pending admin approval.',
    'insufficient_permissions': 'Insufficient permissions for this action',
    
    // Study errors
    'study_not_found': 'Study not found',
    'study_not_found_or_not_published': 'Study not found or not published',
    
    // File upload errors
    'no_audio_file_uploaded': 'No audio file uploaded',
    'only_audio_files_allowed': 'Only audio files are allowed!',
    'could_not_read_audio_directory': 'Could not read audio directory',
    'could_not_delete_file': 'Could not delete file',
    
    // Success messages
    'study_deleted_successfully': 'Study deleted successfully',
    'study_withdrawn': 'Study withdrawn',
    'file_deleted_successfully': 'File deleted successfully',
    'user_created_successfully': 'User created successfully',
    'login_successful': 'Login successful',
    'logout_successful': 'Logout successful',
    'user_approved_successfully': 'User approved successfully',
    'user_rejected_successfully': 'User registration rejected successfully',
    
    // General errors
    'internal_server_error': 'Internal server error',
    'bad_request': 'Bad request',
    'not_found': 'Not found',
    'forbidden': 'Forbidden'
  },
  fr: {
    // Database errors
    'database_error': 'Erreur de base de données',
    'server_error_registration': 'Erreur serveur lors de l\'inscription',
    'server_error_login': 'Erreur serveur lors de la connexion',
    'user_not_found': 'Utilisateur non trouvé',
    
    // Authentication errors
    'user_already_exists': 'L\'utilisateur existe déjà',
    'invalid_credentials': 'Identifiants invalides',
    'access_denied': 'Accès refusé',
    'invalid_token': 'Token invalide ou expiré',
    'no_permission': 'Aucune autorisation pour cette action',
    'user_creation_error': 'Erreur lors de la création de l\'utilisateur',
    'server_error_logout': 'Erreur serveur lors de la déconnexion',
    
    // Study errors
    'study_not_found': 'Étude non trouvée',
    'study_not_found_or_not_published': 'Étude non trouvée ou non publiée',
    
    // File upload errors
    'no_audio_file_uploaded': 'Aucun fichier audio téléchargé',
    'only_audio_files_allowed': 'Seuls les fichiers audio sont autorisés !',
    'could_not_read_audio_directory': 'Impossible de lire le répertoire audio',
    'could_not_delete_file': 'Impossible de supprimer le fichier',
    
    // Success messages
    'study_deleted_successfully': 'Étude supprimée avec succès',
    'study_withdrawn': 'Étude retirée',
    'file_deleted_successfully': 'Fichier supprimé avec succès',
    'user_created_successfully': 'Utilisateur créé avec succès',
    'login_successful': 'Connexion réussie',
    'logout_successful': 'Déconnexion réussie',
    
    // General errors
    'internal_server_error': 'Erreur interne du serveur',
    'bad_request': 'Requête incorrecte',
    'not_found': 'Non trouvé',
    'forbidden': 'Interdit'
  },
  fr: {
    // Database errors
    'database_error': 'Erreur de base de données',
    'server_error_registration': 'Erreur serveur lors de l\'inscription',
    'server_error_login': 'Erreur serveur lors de la connexion',
    'user_not_found': 'Utilisateur non trouvé',
    
    // Authentication errors
    'user_already_exists': 'L\'utilisateur existe déjà',
    'invalid_credentials': 'Identifiants invalides',
    'access_denied': 'Accès refusé',
    'invalid_token': 'Token invalide ou expiré',
    'no_permission': 'Aucune autorisation pour cette action',
    'user_creation_error': 'Erreur lors de la création de l\'utilisateur',
    'server_error_logout': 'Erreur serveur lors de la déconnexion',
    
    // Study errors
    'study_not_found': 'Étude non trouvée',
    'study_not_found_or_not_published': 'Étude non trouvée ou non publiée',
    
    // File upload errors
    'no_audio_file_uploaded': 'Aucun fichier audio téléchargé',
    'only_audio_files_allowed': 'Seuls les fichiers audio sont autorisés !',
    'could_not_read_audio_directory': 'Impossible de lire le répertoire audio',
    'could_not_delete_file': 'Impossible de supprimer le fichier',
    
    // Success messages
    'study_deleted_successfully': 'Étude supprimée avec succès',
    'study_withdrawn': 'Étude retirée',
    'file_deleted_successfully': 'Fichier supprimé avec succès',
    'user_created_successfully': 'Utilisateur créé avec succès',
    'login_successful': 'Connexion réussie',
    'logout_successful': 'Déconnexion réussie',
    
    // General errors
    'internal_server_error': 'Erreur interne du serveur',
    'bad_request': 'Requête invalide',
    'not_found': 'Non trouvé',
    'forbidden': 'Interdit'
  }
};

// Get translation function
function getTranslation(key, language = 'de') {
  // Fallback to German if language not supported
  const lang = translations[language] ? language : 'de';
  
  // Return translation or key if not found
  return translations[lang][key] || key;
}

// Middleware to detect language from request headers
function detectLanguage(req) {
  // Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  
  if (acceptLanguage) {
    // Check for French first
    if (acceptLanguage.toLowerCase().includes('fr')) {
      return 'fr';
    }
    // Then check for English
    if (acceptLanguage.toLowerCase().includes('en')) {
      return 'en';
    }
  }
  
  // Check custom language header
  const customLang = req.headers['x-language'];
  if (customLang && translations[customLang]) {
    return customLang;
  }
  
  // Check if user is authenticated and has language preference
  if (req.user && req.user.language && translations[req.user.language]) {
    return req.user.language;
  }
  
  // Default to German
  return 'de';
}

// Helper function to create localized response
function createLocalizedResponse(req, messageKey, statusCode = 200, additionalData = {}) {
  const language = detectLanguage(req);
  const message = getTranslation(messageKey, language);
  
  return {
    statusCode,
    data: {
      message,
      ...additionalData
    }
  };
}

module.exports = {
  getTranslation,
  detectLanguage,
  createLocalizedResponse,
  translations
};