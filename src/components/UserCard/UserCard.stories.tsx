import React from 'react';
import UserCard from './UserCard';

export default {
  title: 'UserCard',
  component: UserCard
};

export const Default = () => (
  <UserCard
    user={{
      id: '00975694-7b26-4cdc-83d7-a6bdd783c987',
      username: 'User1',
      avatar: './images/bitmoji-other.png',
      gender: 'male',
      age: 22,
      fullName: 'Test User 1'
    }}
  />
);
