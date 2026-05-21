import "./index.css";
import { Composition } from "remotion";
import { OpenScheduleDemo } from "./OpenScheduleDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="OpenScheduleDemo"
        component={OpenScheduleDemo}
        durationInFrames={30 * 60}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
