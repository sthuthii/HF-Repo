import Summary from "./components/Summary";
import Files from "./components/Files";
import Ask from "./components/Ask";

function App() {
  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      <Summary />
      <Ask />
      <Files />
    </div>
  );
}

export default App;