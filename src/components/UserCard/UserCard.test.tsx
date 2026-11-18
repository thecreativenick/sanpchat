import React from 'react';
import { shallow } from 'enzyme';
import { User } from 'features/User/data';
import Avatar from 'components/Avatar/Avatar';
import UserCard from './UserCard';

const defaultProps: {
  user: User;
} = {
  user: {
    id: '00975694-7b26-4cdc-83d7-a6bdd783c987',
    username: 'User1',
    avatar: './images/bitmoji-other.png',
    gender: 'male',
    age: 22,
    fullName: 'Test User 1'
  }
};

describe('<UserCard />', () => {
  it('renders without crashing', () => {
    const component = shallow(<UserCard {...defaultProps} />);
    expect(component.length).toBe(1);
  });

  it('has avatar', () => {
    const component = shallow(<UserCard {...defaultProps} />);
    expect(component.find(Avatar).prop('src')).toBe(defaultProps.user.avatar);
  });

  it('has full name and username', () => {
    const component = shallow(<UserCard {...defaultProps} />);
    expect(component.find('header').text()).toBe(defaultProps.user.fullName);
    expect(component.find('span').text()).toBe(defaultProps.user.username);
  });
});
