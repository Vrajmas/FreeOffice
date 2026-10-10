import DocApp from './DocApp';
import SheetApp from './SheetApp';
export default function App(){return import.meta.env.VITE_APP_KIND==='sheet'?<SheetApp/>:<DocApp/>}
