import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import {
  AboutPage,
  CategoryPage,
  DetailPage,
  HomePage,
  KnowledgePage,
  NotFoundPage,
  SearchPage,
} from '@/pages/jordan-pages';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/knowledge" component={KnowledgePage} />
        <Route path="/knowledge/:id" component={DetailPage} />
        <Route path="/education"><CategoryPage kind="education" eyebrow="مجال المعرفة" title="التعليم في الأردن" description="سجلات ومراجع تساعدك على فهم مسارات التعليم والجهات المرتبطة به." /></Route>
        <Route path="/government"><CategoryPage kind="government" eyebrow="مجال المعرفة" title="الحكومة والخدمات" description="اعثر على معلومات مرتبطة بالجهات والخدمات العامة، مع مصدرها." /></Route>
        <Route path="/tourism"><CategoryPage kind="tourism" eyebrow="مجال المعرفة" title="السياحة في الأردن" description="استكشف ما توفره مصادر المعرفة عن الأماكن والتجارب والجهات السياحية." /></Route>
        <Route path="/about" component={AboutPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
