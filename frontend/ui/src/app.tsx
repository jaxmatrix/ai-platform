import { Allotment } from 'allotment';
import { Renderer } from './components/Renderer';
import { AIChat } from './components/AIChat';
import 'allotment/dist/style.css';

export function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <Allotment>
        <Allotment.Pane preferredSize="30%">
          <Renderer />
        </Allotment.Pane>
        <Allotment.Pane preferredSize="70%">
          <AIChat />
        </Allotment.Pane>
      </Allotment>
    </div>
  )
}
