import React, {useEffect, useState} from "react";
import ReactPlayer from "react-player";

function ResponsivePlayer({url, loop, playing}) {
  // react-player renders differently on the server vs. the client (it needs
  // the browser to detect playback support), which trips React's hydration
  // mismatch check. Rendering it only after mount keeps the server and the
  // initial client render identical (both empty), avoiding the mismatch.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div
      className="relative rounded-lg shadow-lg"
      // https://github.com/CookPete/react-player#responsive-player
      style={{position: "relative", paddingTop: "56.25%", marginBottom: 20}}
    >
      {hasMounted && (
        <ReactPlayer
          url={url}
          loop={loop}
          playing={playing}
          width="100%"
          height="100%"
          controls={true}
          style={{position: "absolute", top: 0, left: 0}}
        />
      )}
    </div>
  );
}

export default ResponsivePlayer;
