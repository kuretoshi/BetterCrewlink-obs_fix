import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import Avatar from './Avatar';
import { overlayPlayer } from './common/AmongUsState';
import { getCosmetic, initializeHats } from './common/cosmetics';

jest.mock('@material-ui/core/styles/makeStyles', () => () => () => ({}));
jest.mock('./common/cosmetics', () => ({
	cosmeticType: { base: 0, hat: 1, hat_back: 2 },
	getCosmetic: jest.fn(),
	getHatDementions: jest.fn(() => ({ top: '0', left: '0', width: '0' })),
	initializeHats: jest.fn(),
	redAlive: 'fallback.png',
}));

test('loads a skin after cosmetic metadata arrives despite voice-state rerenders', async () => {
	let resolveBase!: (value: string) => void;
	let resolveHats!: () => void;
	const baseReady = new Promise<string>((resolve) => { resolveBase = resolve; });
	const hatsReady = new Promise<void>((resolve) => { resolveHats = resolve; });
	const mockGetCosmetic = getCosmetic as jest.Mock;
	mockGetCosmetic.mockImplementation((_colors, _alive, type, id) =>
		type === 0 ? baseReady : Promise.resolve(id === 'skin-1' ? 'skin-image.png' : '')
	);
	(initializeHats as jest.Mock).mockReturnValue(hatsReady);

	const player = {
		colorId: 0,
		hatId: '',
		visorId: '',
		skinId: 'skin-1',
		realColor: ['#C51111', '#7A0838'],
		bugged: false,
	} as overlayPlayer;
	const props = {
		player,
		talking: false,
		borderColor: 'red',
		isAlive: true,
		size: 100,
		mod: 'NONE' as const,
	};
	const { container, rerender } = render(<Avatar {...props} />);
	rerender(<Avatar {...props} talking={true} player={{ ...player, realColor: [...player.realColor] }} />);

	await act(async () => { resolveBase('base-image.png'); });
	await act(async () => { resolveHats(); });
	await waitFor(() => expect(container.querySelector('img[src="skin-image.png"]')).not.toBeNull());
	expect(mockGetCosmetic.mock.calls.filter((call) => call[2] === 0)).toHaveLength(1);
});
