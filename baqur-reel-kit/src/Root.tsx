import React from 'react';
import {Composition} from 'remotion';
import {VIDEO} from './core/tokens';
import {PasteLeak, PASTE_LEAK_DURATION} from './reels/paste-leak/PasteLeak';

// Add one <Composition> per reel. Copy src/reels/paste-leak → src/reels/<new-reel>.
export const Root: React.FC = () => (
  <>
    <Composition
      id="PasteLeak"
      component={PasteLeak}
      durationInFrames={PASTE_LEAK_DURATION}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  </>
);
