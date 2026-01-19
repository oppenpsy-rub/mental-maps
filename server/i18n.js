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
  it: {
    // Database errors
    'database_error': 'Errore del database',
    'server_error_registration': 'Errore del server durante la registrazione',
    'server_error_login': 'Errore del server durante l\'accesso',
    'user_not_found': 'Utente non trovato',
    
    // Authentication errors
    'user_already_exists': 'Utente già esistente',
    'invalid_credentials': 'Credenziali non valide',
    'access_denied': 'Accesso negato',
    'invalid_token': 'Token non valido o scaduto',
    'no_permission': 'Nessun permesso per questa azione',
    'user_creation_error': 'Errore durante la creazione dell\'utente',
    'server_error_logout': 'Errore del server durante la disconnessione',
    'user_registration_pending': 'Registrazione riuscita. In attesa di approvazione dell\'amministratore.',
    'account_pending_approval': 'Il tuo account è in attesa di approvazione dell\'amministratore.',
    'insufficient_permissions': 'Permessi insufficienti per questa azione',
    
    // Study errors
    'study_not_found': 'Studio non trovato',
    'study_not_found_or_not_published': 'Studio non trovato o non pubblicato',
    
    // File upload errors
    'no_audio_file_uploaded': 'Nessun file audio caricato',
    'only_audio_files_allowed': 'Sono consentiti solo file audio!',
    'could_not_read_audio_directory': 'Impossibile leggere la directory audio',
    'could_not_delete_file': 'Impossibile eliminare il file',
    
    // Success messages
    'study_deleted_successfully': 'Studio eliminato con successo',
    'study_withdrawn': 'Studio ritirato',
    'file_deleted_successfully': 'File eliminato con successo',
    'user_created_successfully': 'Utente creato con successo',
    'login_successful': 'Accesso riuscito',
    'logout_successful': 'Disconnessione riuscita',
    'user_approved_successfully': 'Utente approvato con successo',
    'user_rejected_successfully': 'Registrazione utente rifiutata con successo',
    
    // General errors
    'internal_server_error': 'Errore interno del server',
    'bad_request': 'Richiesta non valida',
    'not_found': 'Non trovato',
    'forbidden': 'Proibito'
  },
  es: {
    // Database errors
    'database_error': 'Error de base de datos',
    'server_error_registration': 'Error del servidor durante el registro',
    'server_error_login': 'Error del servidor durante el inicio de sesión',
    'user_not_found': 'Usuario no encontrado',
    
    // Authentication errors
    'user_already_exists': 'El usuario ya existe',
    'invalid_credentials': 'Credenciales inválidas',
    'access_denied': 'Acceso denegado',
    'invalid_token': 'Token inválido o caducado',
    'no_permission': 'Sin permiso para esta acción',
    'user_creation_error': 'Error al crear usuario',
    'server_error_logout': 'Error del servidor durante el cierre de sesión',
    'user_registration_pending': 'Registro exitoso. Espere la aprobación del administrador.',
    'account_pending_approval': 'Su cuenta está pendiente de aprobación por el administrador.',
    'insufficient_permissions': 'Permisos insuficientes para esta acción',
    
    // Study errors
    'study_not_found': 'Estudio no encontrado',
    'study_not_found_or_not_published': 'Estudio no encontrado o no publicado',
    
    // File upload errors
    'no_audio_file_uploaded': 'No se ha subido ningún archivo de audio',
    'only_audio_files_allowed': '¡Solo se permiten archivos de audio!',
    'could_not_read_audio_directory': 'No se pudo leer el directorio de audio',
    'could_not_delete_file': 'No se pudo eliminar el archivo',
    
    // Success messages
    'study_deleted_successfully': 'Estudio eliminado con éxito',
    'study_withdrawn': 'Estudio retirado',
    'file_deleted_successfully': 'Archivo eliminado con éxito',
    'user_created_successfully': 'Usuario creado con éxito',
    'login_successful': 'Inicio de sesión exitoso',
    'logout_successful': 'Cierre de sesión exitoso',
    'user_approved_successfully': 'Usuario aprobado con éxito',
    'user_rejected_successfully': 'Registro de usuario rechazado con éxito',
    
    // General errors
    'internal_server_error': 'Error interno del servidor',
    'bad_request': 'Solicitud incorrecta',
    'not_found': 'No encontrado',
    'forbidden': 'Prohibido'
  },
  pt: {
    // Database errors
    'database_error': 'Erro de banco de dados',
    'server_error_registration': 'Erro do servidor durante o registro',
    'server_error_login': 'Erro do servidor durante o login',
    'user_not_found': 'Usuário não encontrado',
    
    // Authentication errors
    'user_already_exists': 'Usuário já existe',
    'invalid_credentials': 'Credenciais inválidas',
    'access_denied': 'Acesso negado',
    'invalid_token': 'Token inválido ou expirado',
    'no_permission': 'Sem permissão para esta ação',
    'user_creation_error': 'Erro ao criar usuário',
    'server_error_logout': 'Erro do servidor durante o logout',
    'user_registration_pending': 'Registro bem-sucedido. Aguarde a aprovação do administrador.',
    'account_pending_approval': 'Sua conta está aguardando aprovação do administrador.',
    'insufficient_permissions': 'Permissões insuficientes para esta ação',
    
    // Study errors
    'study_not_found': 'Estudo não encontrado',
    'study_not_found_or_not_published': 'Estudo não encontrado ou não publicado',
    
    // File upload errors
    'no_audio_file_uploaded': 'Nenhum arquivo de áudio enviado',
    'only_audio_files_allowed': 'Apenas arquivos de áudio são permitidos!',
    'could_not_read_audio_directory': 'Não foi possível ler o diretório de áudio',
    'could_not_delete_file': 'Não foi possível excluir o arquivo',
    
    // Success messages
    'study_deleted_successfully': 'Estudo excluído com sucesso',
    'study_withdrawn': 'Estudo retirado',
    'file_deleted_successfully': 'Arquivo excluído com sucesso',
    'user_created_successfully': 'Usuário criado com sucesso',
    'login_successful': 'Login bem-sucedido',
    'logout_successful': 'Logout bem-sucedido',
    'user_approved_successfully': 'Usuário aprovado com sucesso',
    'user_rejected_successfully': 'Registro de usuário rejeitado com sucesso',
    
    // General errors
    'internal_server_error': 'Erro interno do servidor',
    'bad_request': 'Requisição inválida',
    'not_found': 'Não encontrado',
    'forbidden': 'Proibido'
  },
  ro: {
    // Database errors
    'database_error': 'Eroare de bază de date',
    'server_error_registration': 'Eroare de server la înregistrare',
    'server_error_login': 'Eroare de server la autentificare',
    'user_not_found': 'Utilizatorul nu a fost găsit',
    
    // Authentication errors
    'user_already_exists': 'Utilizatorul există deja',
    'invalid_credentials': 'Credențiale invalide',
    'access_denied': 'Acces interzis',
    'invalid_token': 'Token invalid sau expirat',
    'no_permission': 'Fără permisiune pentru această acțiune',
    'user_creation_error': 'Eroare la crearea utilizatorului',
    'server_error_logout': 'Eroare de server la deconectare',
    'user_registration_pending': 'Înregistrare reușită. Vă rugăm să așteptați aprobarea administratorului.',
    'account_pending_approval': 'Contul dvs. așteaptă aprobarea administratorului.',
    'insufficient_permissions': 'Permisiuni insuficiente pentru această acțiune',
    
    // Study errors
    'study_not_found': 'Studiu negăsit',
    'study_not_found_or_not_published': 'Studiu negăsit sau nepublicat',
    
    // File upload errors
    'no_audio_file_uploaded': 'Niciun fișier audio încărcat',
    'only_audio_files_allowed': 'Doar fișierele audio sunt permise!',
    'could_not_read_audio_directory': 'Nu s-a putut citi directorul audio',
    'could_not_delete_file': 'Nu s-a putut șterge fișierul',
    
    // Success messages
    'study_deleted_successfully': 'Studiu șters cu succes',
    'study_withdrawn': 'Studiu retras',
    'file_deleted_successfully': 'Fișier șters cu succes',
    'user_created_successfully': 'Utilizator creat cu succes',
    'login_successful': 'Autentificare reușită',
    'logout_successful': 'Deconectare reușită',
    'user_approved_successfully': 'Utilizator aprobat cu succes',
    'user_rejected_successfully': 'Înregistrarea utilizatorului respinsă cu succes',
    
    // General errors
    'internal_server_error': 'Eroare internă de server',
    'bad_request': 'Cerere greșită',
    'not_found': 'Negăsit',
    'forbidden': 'Interzis'
  },
  zh: {
    // Database errors
    'database_error': '数据库错误',
    'server_error_registration': '注册时服务器错误',
    'server_error_login': '登录时服务器错误',
    'user_not_found': '未找到用户',
    
    // Authentication errors
    'user_already_exists': '用户已存在',
    'invalid_credentials': '凭证无效',
    'access_denied': '拒绝访问',
    'invalid_token': '令牌无效或已过期',
    'no_permission': '没有权限执行此操作',
    'user_creation_error': '创建用户时出错',
    'server_error_logout': '注销时服务器错误',
    'user_registration_pending': '注册成功。请等待管理员批准。',
    'account_pending_approval': '您的帐户正在等待管理员批准。',
    'insufficient_permissions': '权限不足，无法执行此操作',
    
    // Study errors
    'study_not_found': '未找到研究',
    'study_not_found_or_not_published': '研究未找到或未发布',
    
    // File upload errors
    'no_audio_file_uploaded': '未上传音频文件',
    'only_audio_files_allowed': '仅允许上传音频文件！',
    'could_not_read_audio_directory': '无法读取音频目录',
    'could_not_delete_file': '无法删除文件',
    
    // Success messages
    'study_deleted_successfully': '研究已成功删除',
    'study_withdrawn': '研究已撤回',
    'file_deleted_successfully': '文件已成功删除',
    'user_created_successfully': '用户已成功创建',
    'login_successful': '登录成功',
    'logout_successful': '注销成功',
    'user_approved_successfully': '用户已成功批准',
    'user_rejected_successfully': '用户注册已成功拒绝',
    
    // General errors
    'internal_server_error': '内部服务器错误',
    'bad_request': '错误请求',
    'not_found': '未找到',
    'forbidden': '禁止'
  },
  ru: {
    // Database errors
    'database_error': 'Ошибка базы данных',
    'server_error_registration': 'Ошибка сервера при регистрации',
    'server_error_login': 'Ошибка сервера при входе',
    'user_not_found': 'Пользователь не найден',
    
    // Authentication errors
    'user_already_exists': 'Пользователь уже существует',
    'invalid_credentials': 'Неверные учетные данные',
    'access_denied': 'Доступ запрещен',
    'invalid_token': 'Неверный или истекший токен',
    'no_permission': 'Нет прав для этого действия',
    'user_creation_error': 'Ошибка при создании пользователя',
    'server_error_logout': 'Ошибка сервера при выходе',
    'user_registration_pending': 'Регистрация успешна. Пожалуйста, дождитесь одобрения администратора.',
    'account_pending_approval': 'Ваша учетная запись ожидает одобрения администратора.',
    'insufficient_permissions': 'Недостаточно прав для этого действия',
    
    // Study errors
    'study_not_found': 'Исследование не найдено',
    'study_not_found_or_not_published': 'Исследование не найдено или не опубликовано',
    
    // File upload errors
    'no_audio_file_uploaded': 'Аудиофайл не загружен',
    'only_audio_files_allowed': 'Разрешены только аудиофайлы!',
    'could_not_read_audio_directory': 'Не удалось прочитать аудио каталог',
    'could_not_delete_file': 'Не удалось удалить файл',
    
    // Success messages
    'study_deleted_successfully': 'Исследование успешно удалено',
    'study_withdrawn': 'Исследование отозвано',
    'file_deleted_successfully': 'Файл успешно удален',
    'user_created_successfully': 'Пользователь успешно создан',
    'login_successful': 'Вход выполнен успешно',
    'logout_successful': 'Выход выполнен успешно',
    'user_approved_successfully': 'Пользователь успешно одобрен',
    'user_rejected_successfully': 'Регистрация пользователя успешно отклонена',
    
    // General errors
    'internal_server_error': 'Внутренняя ошибка сервера',
    'bad_request': 'Неверный запрос',
    'not_found': 'Не найдено',
    'forbidden': 'Запрещено'
  },
  ca: {
    // Database errors
    'database_error': 'Error de la base de dades',
    'server_error_registration': 'Error del servidor durant el registre',
    'server_error_login': 'Error del servidor durant l\'inici de sessió',
    'user_not_found': 'Usuari no trobat',
    
    // Authentication errors
    'user_already_exists': 'L\'usuari ja existeix',
    'invalid_credentials': 'Credencials no vàlides',
    'access_denied': 'Accés denegat',
    'invalid_token': 'Token no vàlid o caducat',
    'no_permission': 'Sense permís per a aquesta acció',
    'user_creation_error': 'Error en crear l\'usuari',
    'server_error_logout': 'Error del servidor durant el tancament de sessió',
    'user_registration_pending': 'Registre exitós. Si us plau, espereu l\'aprovació de l\'administrador.',
    'account_pending_approval': 'El vostre compte està pendent d\'aprovació per l\'administrador.',
    'insufficient_permissions': 'Permisos insuficients per a aquesta acció',
    
    // Study errors
    'study_not_found': 'Estudi no trobat',
    'study_not_found_or_not_published': 'Estudi no trobat o no publicat',
    
    // File upload errors
    'no_audio_file_uploaded': 'No s\'ha pujat cap arxiu d\'àudio',
    'only_audio_files_allowed': 'Només es permeten arxius d\'àudio!',
    'could_not_read_audio_directory': 'No s\'ha pogut llegir el directori d\'àudio',
    'could_not_delete_file': 'No s\'ha pogut eliminar l\'arxiu',
    
    // Success messages
    'study_deleted_successfully': 'Estudi eliminat amb èxit',
    'study_withdrawn': 'Estudi retirat',
    'file_deleted_successfully': 'Arxiu eliminat amb èxit',
    'user_created_successfully': 'Usuari creat amb èxit',
    'login_successful': 'Inici de sessió exitós',
    'logout_successful': 'Tancament de sessió exitós',
    'user_approved_successfully': 'Usuari aprovat amb èxit',
    'user_rejected_successfully': 'Registre d\'usuari rebutjat amb èxit',
    
    // General errors
    'internal_server_error': 'Error intern del servidor',
    'bad_request': 'Petició incorrecta',
    'not_found': 'No trobat',
    'forbidden': 'Prohibit'
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
  // Check custom language header (highest priority)
  const customLang = req.headers['x-language'];
  if (customLang && translations[customLang]) {
    return customLang;
  }
  
  // Check if user is authenticated and has language preference
  if (req.user && req.user.language && translations[req.user.language]) {
    return req.user.language;
  }

  // Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  
  if (acceptLanguage) {
    const supportedLanguages = Object.keys(translations);
    const lowerAccept = acceptLanguage.toLowerCase();
    
    // Check for each supported language
    for (const lang of supportedLanguages) {
      if (lowerAccept.includes(lang)) {
        return lang;
      }
    }
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