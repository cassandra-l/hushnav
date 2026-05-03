import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

const AnimatedLayout = () => {
  const location = useLocation();
  const element = useOutlet();

  return (
    <AnimatePresence mode="wait">
      {element && (
        <div key={location.pathname} className="w-full">
          {element}
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedLayout;
