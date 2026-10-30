import React from "react";
import { render } from "@testing-library/react";
import { MeetingHud } from "./App";
import { GameState, overlayPlayer, VoiceState } from "./common/AmongUsState";

jest.mock("./Avatar", () => () => null);

const player = (id: number, color: string): overlayPlayer =>
  ({
    id,
    clientId: id,
    realColor: [color, color],
    isDead: false,
    disconnected: false,
    isLocal: false,
  }) as overlayPlayer;
const players = [
  player(0, "#ff0000"),
  player(1, "#00ff00"),
  player(2, "#0000ff"),
];
const voice = (list = players): VoiceState => ({
  overlayState: { gameState: GameState.DISCUSSION, players: list },
  otherTalking: { 0: true, 1: true, 2: true },
  otherDead: {},
  localTalking: false,
  localIsAlive: true,
  mod: "NONE",
});

test("meeting slots stay fixed when a player dies and reset at the next meeting", () => {
  const initial = voice();
  const { container, rerender } = render(
    <MeetingHud gameState={initial.overlayState} voiceState={initial} />,
  );
  const shadows = () =>
    Array.from(container.firstElementChild!.firstElementChild!.children).map(
      (element) => (element as HTMLElement).style.boxShadow,
    );
  const order = shadows();
  const updated = voice(players.map((p) => ({ ...p, isDead: p.id === 0 })));
  rerender(
    <MeetingHud gameState={updated.overlayState} voiceState={updated} />,
  );
  expect(shadows()).toEqual(order);
  const tasks = { ...updated.overlayState, gameState: GameState.TASKS };
  rerender(<MeetingHud gameState={tasks} voiceState={updated} />);
  rerender(
    <MeetingHud gameState={updated.overlayState} voiceState={updated} />,
  );
  expect(shadows()).toEqual([order[1], order[2], order[0]]);
});

test("old HUD payload selects two-column layout and fits the viewport", () => {
  const initial = { ...voice(), oldMeetingHud: true };
  const { container } = render(
    <MeetingHud gameState={initial.overlayState} voiceState={initial} />,
  );
  const hud = container.firstElementChild!;
  const tablet = hud.firstElementChild!;
  expect(getComputedStyle(tablet).width).toBe("88.45%");
  const width = parseFloat(getComputedStyle(hud).width);
  const height = parseFloat(getComputedStyle(hud).height);
  expect(width / height).toBeCloseTo(854 / 579);
  expect(height).toBeLessThanOrEqual(window.innerHeight * 0.96);
  expect(width).toBeLessThanOrEqual(window.innerWidth);
});

const viewports = [
  [1920, 1080],
  [1280, 720],
  [1024, 768],
  [1280, 800],
  [2560, 1080],
];
const originalViewport = [window.innerWidth, window.innerHeight];
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
};
const roster = (count: number) =>
  Array.from({ length: count }, (_, id) =>
    player(id, "#" + (0x102030 + id).toString(16)),
  );
const framesIn = (container: Element): HTMLElement[] =>
  Array.from(
    container.firstElementChild!.firstElementChild!.children,
  ) as HTMLElement[];

// NoS More15Helpers, commit 990f542a2180b3ea0967fbe756d902dcb1e8c364,
// MeetingPatch.cs: 16-18 uses 3 columns/.95 scale; 19+ uses 4/.76.
// Shipped MeetingHud: VoteOrigin(-3.1,1.5), ButtonParent(+.25,0),
// pitch(2.9,-.76), centered background(2.7,.63), camera half-height3.
// AspectSize fits the phone background's width 8.54 * local X scale1.2.
const projectedCard = (
  width: number,
  height: number,
  count: number,
  index: number,
) => {
  const compact = count <= 18;
  const columns = compact ? 3 : 4;
  const scale = compact ? 0.95 : 0.76;
  const fit = Math.min(1, (6 * width) / (height * 8.54 * 1.2));
  const unit = (height / 6) * fit;
  const cardWidth = 2.7 * scale * unit;
  const cardHeight = 0.63 * scale * unit;
  return {
    width: cardWidth,
    height: cardHeight,
    x:
      width / 2 +
      (-3.1 +
        0.25 +
        (compact ? 0.1 : -0.355) +
        (index % columns) * 2.9 * scale * (compact ? 1 : 0.974)) *
        unit -
      cardWidth / 2,
    y:
      height / 2 -
      (1.5 +
        (compact ? 0.145 : 0) -
        Math.floor(index / columns) * 0.76 * scale * (compact ? 0.89 : 1)) *
        unit -
      cardHeight / 2,
  };
};

afterEach(() => setViewport(originalViewport[0], originalViewport[1]));

describe.each(viewports)("meeting viewport %i x %i", (width, height) => {
  beforeEach(() => setViewport(width, height));

  test.each([16, 18, 19, 24])(
    "NoS %i-player frames follow the game grid and fit the viewport",
    (count) => {
      const initial: VoiceState = { ...voice(roster(count)), mod: "NoS" };
      const { container } = render(
        <MeetingHud gameState={initial.overlayState} voiceState={initial} />,
      );
      const hud = getComputedStyle(container.firstElementChild!);
      const hudLeft = (width - parseFloat(hud.width)) / 2;
      const hudTop = (height - parseFloat(hud.height)) / 2;
      const frames = framesIn(container);
      expect(frames).toHaveLength(count);
      frames.forEach((frame, index) => {
        const expected = projectedCard(width, height, count, index);
        expect(frame.style.position).toBe("absolute");
        expect(parseFloat(frame.style.width)).toBeCloseTo(expected.width, 3);
        expect(parseFloat(frame.style.height)).toBeCloseTo(expected.height, 3);
        expect(parseFloat(frame.style.left) + hudLeft).toBeCloseTo(
          expected.x,
          3,
        );
        expect(parseFloat(frame.style.top) + hudTop).toBeCloseTo(expected.y, 3);
        expect(parseFloat(frame.style.margin)).toBe(0);
        expect(expected.x).toBeGreaterThanOrEqual(0);
        expect(expected.y).toBeGreaterThanOrEqual(0);
        expect(expected.x + expected.width).toBeLessThanOrEqual(width);
        expect(expected.y + expected.height).toBeLessThanOrEqual(height);
      });
    },
  );

  test.each([
    [15, "NoS", false],
    [16, "NONE", false],
    [16, undefined, false],
    [16, "NoS", true],
  ] as const)(
    "legacy layout stays unchanged for %i players, mod %s, old HUD %s",
    (count, mod, oldMeetingHud) => {
      // Older relays omit mod entirely; count alone must not select the NoS grid.
      const initial = {
        ...voice(roster(count)),
        mod,
        oldMeetingHud,
      } as VoiceState;
      const { container } = render(
        <MeetingHud gameState={initial.overlayState} voiceState={initial} />,
      );
      const tablet = container.firstElementChild!.firstElementChild!;
      expect(getComputedStyle(tablet).width).toBe(
        oldMeetingHud ? "88.45%" : "100%",
      );
      expect(getComputedStyle(tablet).left).toBe(
        oldMeetingHud ? "4.7%" : "0.4%",
      );
      framesIn(container).forEach((frame) => {
        expect(frame.style.position).toBe("");
        expect(getComputedStyle(frame).width).toBe(
          oldMeetingHud ? "46.41%" : "30%",
        );
        expect(getComputedStyle(frame).marginLeft).toBe(
          oldMeetingHud ? "0%" : "2.4%",
        );
      });
      if (oldMeetingHud) {
        const hud = getComputedStyle(container.firstElementChild!);
        expect(parseFloat(hud.width) / parseFloat(hud.height)).toBeCloseTo(
          854 / 579,
        );
        expect(parseFloat(hud.width)).toBeLessThanOrEqual(width);
        expect(parseFloat(hud.height)).toBeLessThanOrEqual(height * 0.96);
      }
    },
  );
});

test("large NoS frames preserve live voice/colors and frozen dead/disconnected slot order", () => {
  setViewport(1920, 1080);
  const list = roster(16)
    .map((entry) => ({
      ...entry,
      isLocal: entry.id === 0,
      isDead: entry.id === 1,
      disconnected: entry.id === 2,
    }))
    .reverse();
  const initial: VoiceState = {
    ...voice(list),
    mod: "NoS",
    otherTalking: { 5: true },
    localTalking: true,
  };
  const { container, rerender } = render(
    <MeetingHud gameState={initial.overlayState} voiceState={initial} />,
  );
  const frames = () => framesIn(container);
  const order = [
    0,
    ...Array.from({ length: 13 }, (_, index) => index + 3),
    1,
    2,
  ];
  frames().forEach((frame, index) => {
    expect(frame.style.boxShadow).toContain(
      list.find((entry) => entry.id === order[index])!.realColor[0],
    );
    expect(frame.style.opacity).toBe(
      order[index] === 0 || order[index] === 5 ? "1" : "0",
    );
  });
  const positions = frames().map((frame) => [
    frame.style.left,
    frame.style.top,
    frame.style.width,
    frame.style.height,
  ]);
  const updated: VoiceState = {
    ...initial,
    localTalking: false,
    otherTalking: { 1: true, 2: true },
    overlayState: {
      ...initial.overlayState,
      players: list.map((entry) => ({
        ...entry,
        isDead: entry.id === 0 || entry.isDead,
        realColor: entry.id === 5 ? ["#aabbcc", "#445566"] : entry.realColor,
        nosColor: entry.id === 3 ? "#f1a2b3" : undefined,
      })),
    },
  };
  rerender(
    <MeetingHud gameState={updated.overlayState} voiceState={updated} />,
  );
  expect(
    frames().map((frame) => [
      frame.style.left,
      frame.style.top,
      frame.style.width,
      frame.style.height,
    ]),
  ).toEqual(positions);
  expect(frames()[0].style.opacity).toBe("0");
  expect(frames()[14].style.opacity).toBe("1");
  expect(frames()[15].style.opacity).toBe("1");
  expect(frames()[1].style.boxShadow).toContain("#f1a2b3");
  expect(frames()[3].style.boxShadow).toContain("#aabbcc");
  rerender(
    <MeetingHud
      gameState={{ ...updated.overlayState, gameState: GameState.TASKS }}
      voiceState={updated}
    />,
  );
  expect(container.firstElementChild).toBeNull();
  rerender(
    <MeetingHud gameState={updated.overlayState} voiceState={updated} />,
  );
  expect(frames()[0].style.boxShadow).toContain("#f1a2b3");
  expect(frames()[13].style.boxShadow).toContain(
    list.find((entry) => entry.id === 0)!.realColor[0],
  );
});
