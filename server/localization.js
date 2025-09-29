// Backend localization system
const translations = {
  de: {
    // Authentication messages
    'auth.invalid_credentials': 'Ungültige Anmeldedaten',
    'auth.user_not_found': 'Benutzer nicht gefunden',
    'auth.login_success': 'Erfolgreich angemeldet',
    'auth.logout_success': 'Erfolgreich abgemeldet',
    'auth.unauthorized': 'Nicht autorisiert',
    'auth.token_expired': 'Token abgelaufen',
    
    // Profile messages
    'profile.updated_success': 'Profil erfolgreich aktualisiert',
    'profile.update_error': 'Fehler beim Aktualisieren des Profils',
    'profile.not_found': 'Profil nicht gefunden',
    'profile.invalid_data': 'Ungültige Profildaten',
    
    // Study messages
    'study.created_success': 'Studie erfolgreich erstellt',
    'study.updated_success': 'Studie erfolgreich aktualisiert',
    'study.deleted_success': 'Studie erfolgreich gelöscht',
    'study.not_found': 'Studie nicht gefunden',
    'study.access_denied': 'Zugriff auf Studie verweigert',
    'study.invalid_access_code': 'Ungültiger Zugangscode',
    
    // General error messages
    'error.server_error': 'Serverfehler',
    'error.database_error': 'Datenbankfehler',
    'error.validation_error': 'Validierungsfehler',
    'error.not_found': 'Nicht gefunden',
    'error.forbidden': 'Verboten',
    'error.bad_request': 'Ungültige Anfrage'
  },
  
  en: {
    // Authentication messages
    'auth.invalid_credentials': 'Invalid credentials',
    'auth.user_not_found': 'User not found',
    'auth.login_success': 'Successfully logged in',
    'auth.logout_success': 'Successfully logged out',
    'auth.unauthorized': 'Unauthorized',
    'auth.token_expired': 'Token expired',
    
    // Profile messages
    'profile.updated_success': 'Profile updated successfully',
    'profile.update_error': 'Error updating profile',
    'profile.not_found': 'Profile not found',
    'profile.invalid_data': 'Invalid profile data',
    
    // Study messages
    'study.created_success': 'Study created successfully',
    'study.updated_success': 'Study updated successfully',
    'study.deleted_success': 'Study deleted successfully',
    'study.not_found': 'Study not found',
    'study.access_denied': 'Access to study denied',
    'study.invalid_access_code': 'Invalid access code',
    
    // General error messages
    'error.server_error': 'Server error',
    'error.database_error': 'Database error',
    'error.validation_error': 'Validation error',
    'error.not_found': 'Not found',
    'error.forbidden': 'Forbidden',
    'error.bad_request': 'Bad request'
  },
  
  fr: {
    // Authentication messages
    'auth.invalid_credentials': 'Identifiants invalides',
    'auth.user_not_found': 'Utilisateur non trouvé',
    'auth.login_success': 'Connexion réussie',
    'auth.logout_success': 'Déconnexion réussie',
    'auth.unauthorized': 'Non autorisé',
    'auth.token_expired': 'Token expiré',
    
    // Profile messages
    'profile.updated_success': 'Profil mis à jour avec succès',
    'profile.update_error': 'Erreur lors de la mise à jour du profil',
    'profile.not_found': 'Profil non trouvé',
    'profile.invalid_data': 'Données de profil invalides',
    
    // Study messages
    'study.created_success': 'Étude créée avec succès',
    'study.updated_success': 'Étude mise à jour avec succès',
    'study.deleted_success': 'Étude supprimée avec succès',
    'study.not_found': 'Étude non trouvée',
    'study.access_denied': 'Accès à l\'étude refusé',
    'study.invalid_access_code': 'Code d\'accès invalide',
    
    // General error messages
    'error.server_error': 'Erreur serveur',
    'error.database_error': 'Erreur de base de données',
    'error.validation_error': 'Erreur de validation',
    'error.not_found': 'Non trouvé',
    'error.forbidden': 'Interdit',
    'error.bad_request': 'Requête invalide'
  },
  
  it: {
    // Authentication messages
    'auth.invalid_credentials': 'Credenziali non valide',
    'auth.user_not_found': 'Utente non trovato',
    'auth.login_success': 'Accesso effettuato con successo',
    'auth.logout_success': 'Disconnessione effettuata con successo',
    'auth.unauthorized': 'Non autorizzato',
    'auth.token_expired': 'Token scaduto',
    
    // Profile messages
    'profile.updated_success': 'Profilo aggiornato con successo',
    'profile.update_error': 'Errore nell\'aggiornamento del profilo',
    'profile.not_found': 'Profilo non trovato',
    'profile.invalid_data': 'Dati del profilo non validi',
    
    // Study messages
    'study.created_success': 'Studio creato con successo',
    'study.updated_success': 'Studio aggiornato con successo',
    'study.deleted_success': 'Studio eliminato con successo',
    'study.not_found': 'Studio non trovato',
    'study.access_denied': 'Accesso allo studio negato',
    'study.invalid_access_code': 'Codice di accesso non valido',
    
    // General error messages
    'error.server_error': 'Errore del server',
    'error.database_error': 'Errore del database',
    'error.validation_error': 'Errore di validazione',
    'error.not_found': 'Non trovato',
    'error.forbidden': 'Vietato',
    'error.bad_request': 'Richiesta non valida'
  },
  
  es: {
    // Authentication messages
    'auth.invalid_credentials': 'Credenciales inválidas',
    'auth.user_not_found': 'Usuario no encontrado',
    'auth.login_success': 'Inicio de sesión exitoso',
    'auth.logout_success': 'Cierre de sesión exitoso',
    'auth.unauthorized': 'No autorizado',
    'auth.token_expired': 'Token expirado',
    
    // Profile messages
    'profile.updated_success': 'Perfil actualizado exitosamente',
    'profile.update_error': 'Error al actualizar el perfil',
    'profile.not_found': 'Perfil no encontrado',
    'profile.invalid_data': 'Datos de perfil inválidos',
    
    // Study messages
    'study.created_success': 'Estudio creado exitosamente',
    'study.updated_success': 'Estudio actualizado exitosamente',
    'study.deleted_success': 'Estudio eliminado exitosamente',
    'study.not_found': 'Estudio no encontrado',
    'study.access_denied': 'Acceso al estudio denegado',
    'study.invalid_access_code': 'Código de acceso inválido',
    
    // General error messages
    'error.server_error': 'Error del servidor',
    'error.database_error': 'Error de base de datos',
    'error.validation_error': 'Error de validación',
    'error.not_found': 'No encontrado',
    'error.forbidden': 'Prohibido',
    'error.bad_request': 'Solicitud incorrecta'
  },
  
  pt: {
    // Authentication messages
    'auth.invalid_credentials': 'Credenciais inválidas',
    'auth.user_not_found': 'Usuário não encontrado',
    'auth.login_success': 'Login realizado com sucesso',
    'auth.logout_success': 'Logout realizado com sucesso',
    'auth.unauthorized': 'Não autorizado',
    'auth.token_expired': 'Token expirado',
    
    // Profile messages
    'profile.updated_success': 'Perfil atualizado com sucesso',
    'profile.update_error': 'Erro ao atualizar perfil',
    'profile.not_found': 'Perfil não encontrado',
    'profile.invalid_data': 'Dados de perfil inválidos',
    
    // Study messages
    'study.created_success': 'Estudo criado com sucesso',
    'study.updated_success': 'Estudo atualizado com sucesso',
    'study.deleted_success': 'Estudo excluído com sucesso',
    'study.not_found': 'Estudo não encontrado',
    'study.access_denied': 'Acesso ao estudo negado',
    'study.invalid_access_code': 'Código de acesso inválido',
    
    // General error messages
    'error.server_error': 'Erro do servidor',
    'error.database_error': 'Erro de banco de dados',
    'error.validation_error': 'Erro de validação',
    'error.not_found': 'Não encontrado',
    'error.forbidden': 'Proibido',
    'error.bad_request': 'Solicitação inválida'
  },
  
  ro: {
    // Authentication messages
    'auth.invalid_credentials': 'Credențiale invalide',
    'auth.user_not_found': 'Utilizator nu a fost găsit',
    'auth.login_success': 'Autentificare reușită',
    'auth.logout_success': 'Deconectare reușită',
    'auth.unauthorized': 'Neautorizat',
    'auth.token_expired': 'Token expirat',
    
    // Profile messages
    'profile.updated_success': 'Profil actualizat cu succes',
    'profile.update_error': 'Eroare la actualizarea profilului',
    'profile.not_found': 'Profil nu a fost găsit',
    'profile.invalid_data': 'Date de profil invalide',
    
    // Study messages
    'study.created_success': 'Studiu creat cu succes',
    'study.updated_success': 'Studiu actualizat cu succes',
    'study.deleted_success': 'Studiu șters cu succes',
    'study.not_found': 'Studiu nu a fost găsit',
    'study.access_denied': 'Acces la studiu refuzat',
    'study.invalid_access_code': 'Cod de acces invalid',
    
    // General error messages
    'error.server_error': 'Eroare de server',
    'error.database_error': 'Eroare de bază de date',
    'error.validation_error': 'Eroare de validare',
    'error.not_found': 'Nu a fost găsit',
    'error.forbidden': 'Interzis',
    'error.bad_request': 'Cerere invalidă'
  },
  
  zh: {
    // Authentication messages
    'auth.invalid_credentials': '无效凭据',
    'auth.user_not_found': '用户未找到',
    'auth.login_success': '登录成功',
    'auth.logout_success': '注销成功',
    'auth.unauthorized': '未授权',
    'auth.token_expired': '令牌已过期',
    
    // Profile messages
    'profile.updated_success': '个人资料更新成功',
    'profile.update_error': '更新个人资料时出错',
    'profile.not_found': '个人资料未找到',
    'profile.invalid_data': '无效的个人资料数据',
    
    // Study messages
    'study.created_success': '研究创建成功',
    'study.updated_success': '研究更新成功',
    'study.deleted_success': '研究删除成功',
    'study.not_found': '研究未找到',
    'study.access_denied': '拒绝访问研究',
    'study.invalid_access_code': '无效的访问代码',
    
    // General error messages
    'error.server_error': '服务器错误',
    'error.database_error': '数据库错误',
    'error.validation_error': '验证错误',
    'error.not_found': '未找到',
    'error.forbidden': '禁止',
    'error.bad_request': '错误请求'
  },
  
  ru: {
    // Authentication messages
    'auth.invalid_credentials': 'Неверные учетные данные',
    'auth.user_not_found': 'Пользователь не найден',
    'auth.login_success': 'Успешный вход в систему',
    'auth.logout_success': 'Успешный выход из системы',
    'auth.unauthorized': 'Не авторизован',
    'auth.token_expired': 'Токен истек',
    
    // Profile messages
    'profile.updated_success': 'Профиль успешно обновлен',
    'profile.update_error': 'Ошибка обновления профиля',
    'profile.not_found': 'Профиль не найден',
    'profile.invalid_data': 'Неверные данные профиля',
    
    // Study messages
    'study.created_success': 'Исследование успешно создано',
    'study.updated_success': 'Исследование успешно обновлено',
    'study.deleted_success': 'Исследование успешно удалено',
    'study.not_found': 'Исследование не найдено',
    'study.access_denied': 'Доступ к исследованию запрещен',
    'study.invalid_access_code': 'Неверный код доступа',
    
    // General error messages
    'error.server_error': 'Ошибка сервера',
    'error.database_error': 'Ошибка базы данных',
    'error.validation_error': 'Ошибка валидации',
    'error.not_found': 'Не найдено',
    'error.forbidden': 'Запрещено',
    'error.bad_request': 'Неверный запрос'
  },
  
  ca: {
    // Authentication messages
    'auth.invalid_credentials': 'Credencials invàlides',
    'auth.user_not_found': 'Usuari no trobat',
    'auth.login_success': 'Inici de sessió exitós',
    'auth.logout_success': 'Tancament de sessió exitós',
    'auth.unauthorized': 'No autoritzat',
    'auth.token_expired': 'Token expirat',
    
    // Profile messages
    'profile.updated_success': 'Perfil actualitzat amb èxit',
    'profile.update_error': 'Error en actualitzar el perfil',
    'profile.not_found': 'Perfil no trobat',
    'profile.invalid_data': 'Dades de perfil invàlides',
    
    // Study messages
    'study.created_success': 'Estudi creat amb èxit',
    'study.updated_success': 'Estudi actualitzat amb èxit',
    'study.deleted_success': 'Estudi eliminat amb èxit',
    'study.not_found': 'Estudi no trobat',
    'study.access_denied': 'Accés a l\'estudi denegat',
    'study.invalid_access_code': 'Codi d\'accés invàlid',
    
    // General error messages
    'error.server_error': 'Error del servidor',
    'error.database_error': 'Error de base de dades',
    'error.validation_error': 'Error de validació',
    'error.not_found': 'No trobat',
    'error.forbidden': 'Prohibit',
    'error.bad_request': 'Sol·licitud incorrecta'
  }
};

/**
 * Get localized message based on user's language preference
 * @param {string} key - Translation key
 * @param {string} language - User's preferred language (defaults to 'de')
 * @returns {string} Localized message
 */
function getLocalizedMessage(key, language = 'de') {
  // Fallback to German if language not supported
  const supportedLanguage = translations[language] ? language : 'de';
  
  // Get the translation or fallback to English, then German, then the key itself
  return translations[supportedLanguage][key] || 
         translations['en'][key] || 
         translations['de'][key] || 
         key;
}

/**
 * Middleware to extract user's language preference from request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function extractUserLanguage(req, res, next) {
  // Try to get language from user profile (if authenticated)
  if (req.user && req.user.language) {
    req.userLanguage = req.user.language;
  }
  // Fallback to Accept-Language header
  else if (req.headers['accept-language']) {
    const acceptedLanguages = req.headers['accept-language'].split(',');
    const primaryLanguage = acceptedLanguages[0].split('-')[0].toLowerCase();
    req.userLanguage = translations[primaryLanguage] ? primaryLanguage : 'de';
  }
  // Default to German
  else {
    req.userLanguage = 'de';
  }
  
  next();
}

/**
 * Helper function to create localized response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} messageKey - Translation key for the message
 * @param {string} language - User's preferred language
 * @param {Object} data - Additional data to include in response
 */
function sendLocalizedResponse(res, statusCode, messageKey, language = 'de', data = {}) {
  const message = getLocalizedMessage(messageKey, language);
  res.status(statusCode).json({
    message,
    ...data
  });
}

module.exports = {
  translations,
  getLocalizedMessage,
  extractUserLanguage,
  sendLocalizedResponse
};