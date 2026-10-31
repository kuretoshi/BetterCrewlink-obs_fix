import React from 'react';
import { render } from '@testing-library/react';
import { MeetingHud } from './App';
import { GameState, overlayPlayer, VoiceState } from './common/AmongUsState';
jest.mock('./Avatar', () => () => null);

test.each([16, 30, 31, 45])('SNR %i players follow real 15-slot pages without resizing', count => {
  const ids = Array.from({length:count}, (_,index) => count - 1 - index);
  const players = ids.slice().reverse().map(id => ({id,clientId:id+100,isLocal:id===0,
    isDead:id===1,disconnected:id===2,realColor:['#112233','#112233']} as overlayPlayer));
  const state: VoiceState = {mod:'SUPER_NEW_ROLES',overlayState:{gameState:GameState.DISCUSSION,players},
    otherTalking:{115:true},otherDead:{},localTalking:true,localIsAlive:true,
    snrMeeting:{enabled:true,currentPage:1,playerIds:ids}};
  const {container,rerender}=render(<MeetingHud gameState={state.overlayState} voiceState={state}/>);
  const frames=()=>Array.from(container.querySelectorAll<HTMLElement>('[data-meeting-player]'));
  const dimensions=frames().map(frame=>[getComputedStyle(frame).width,getComputedStyle(frame).height]);
  for(const currentPage of [1,2,Math.ceil(count/15),1]) {
    state.snrMeeting={enabled:true,currentPage,playerIds:ids};
    rerender(<MeetingHud gameState={state.overlayState} voiceState={{...state}}/>);
    expect(frames().map(f=>Number(f.dataset.meetingPlayer))).toEqual(ids.slice((currentPage-1)*15,currentPage*15));
    frames().forEach(frame=>{
      expect([getComputedStyle(frame).width,getComputedStyle(frame).height]).toEqual(dimensions[0]);
      expect(getComputedStyle(frame).width).toBe('30%');
      expect(frame.style.opacity).toBe(['0','15'].includes(frame.dataset.meetingPlayer!)?'1':'0');
    });
  }
  state.snrMeeting=undefined;
  rerender(<MeetingHud gameState={state.overlayState} voiceState={{...state}}/>);
  expect(frames()).toHaveLength(0);
});

test('SNR missing IDs preserve empty slots; malformed pages clear all speech outlines',()=>{
  const ids=Array.from({length:31},(_,id)=>id);
  const players=ids.filter(id=>id!==16).map(id=>({id,clientId:id,realColor:['#112233','#112233']} as overlayPlayer));
  const state:VoiceState={mod:'SUPER_NEW_ROLES',overlayState:{gameState:GameState.DISCUSSION,players},
    otherTalking:{17:true},otherDead:{},localTalking:false,localIsAlive:true,
    snrMeeting:{enabled:true,currentPage:2,playerIds:ids}};
  const {container,rerender}=render(<MeetingHud gameState={state.overlayState} voiceState={state}/>);
  const slots=()=>Array.from(container.firstElementChild!.firstElementChild!.children) as HTMLElement[];
  expect(slots()).toHaveLength(15);
  expect(slots()[1].dataset.meetingPlayer).toBeUndefined();
  expect(slots()[1].style.opacity).toBe('0');
  expect(slots()[2].dataset.meetingPlayer).toBe('17');
  expect(slots()[2].style.opacity).toBe('1');
  state.snrMeeting={enabled:true,currentPage:4,playerIds:ids};
  rerender(<MeetingHud gameState={state.overlayState} voiceState={{...state}}/>);
  expect(slots()).toHaveLength(0);
});
