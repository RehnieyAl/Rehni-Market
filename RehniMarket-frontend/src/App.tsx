import { isMobile } from "react-device-detect";
import AppRouter from "./routers/AppRouter";
import MobileRedirect from "@/shared/components/DeviceRedirect";

export default function App() {

  const continueWeb = localStorage.getItem("continueWeb");

  if (isMobile && !continueWeb) {
    return <MobileRedirect />;
  }

  return <AppRouter />;
}