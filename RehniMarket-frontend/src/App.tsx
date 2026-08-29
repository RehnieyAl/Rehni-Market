import AppRouter from "./routers/AppRouter";
import MobileAppNotice from "@/shared/components/MobileAppNotice";

export default function App() {
  return (
    <>
      <AppRouter />
      <MobileAppNotice />
    </>
  );
}
