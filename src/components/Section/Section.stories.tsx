import React from 'react';
import { User } from 'features/User/data';
import UserCard from 'components/UserCard/UserCard';
import Section from './Section';

export default {
  title: 'Section',
  component: Section
};

const users: User[] = [
  {
    id: '00975694-7b26-4cdc-83d7-a6bdd783c987',
    username: 'User1',
    avatar: './images/bitmoji-other.png',
    gender: 'male',
    age: 22,
    fullName: 'Test User 1'
  },
  {
    id: '0a08aeaa-5d5c-4367-bbd4-078cf9cb8f5f',
    username: 'User2',
    avatar: './images/bitmoji-other.png',
    gender: 'male',
    age: 22,
    fullName: 'Test User 2'
  },
  {
    id: '329798fe-82f5-4ff2-a71e-113e2262de30',
    username: 'User3',
    avatar: './images/bitmoji-other.png',
    gender: 'male',
    age: 22,
    fullName: 'Test User 3'
  }
];

export const Default = () => (
  <Section header="Some Header">
    <p>Some content..</p>
  </Section>
);

export const withCards = () => (
  <Section header="Your Friends">
    {users.map((user) => (
      <UserCard key={user.id} user={user} />
    ))}
  </Section>
);
