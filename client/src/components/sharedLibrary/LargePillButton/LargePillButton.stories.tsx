import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import LargePillButton from './LargePillButton';

const meta = {
  title: 'Components/LargePillButton',
  component: LargePillButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    textColor: {
      control: 'radio',
      options: ['accent', 'white'],
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof LargePillButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {
  args: {
    children: 'Ask AI',
    textColor: 'accent',
  },
};

export const White: Story = {
  args: {
    children: 'Get Started',
    textColor: 'white',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Ask AI',
    disabled: true,
  },
};
