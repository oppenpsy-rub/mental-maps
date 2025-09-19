import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { store } from './store';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import GlobalStyles from './styles/GlobalStyles';
import { theme } from './styles/theme';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <GlobalStyles />
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;