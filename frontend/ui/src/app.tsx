import { Allotment } from 'allotment';
import { Renderer } from './components/Renderer';
import { AIChat } from './components/AIChat';
import 'allotment/dist/style.css';

export function App() {
  return (
    <div className="h-screen">
      <Allotment>
        <Allotment.Pane preferredSize="70%">
          <Renderer />
        </Allotment.Pane>
        <Allotment.Pane preferredSize="30%">
          <AIChat />
        </Allotment.Pane>
      </Allotment>
    </div>
  )
}
