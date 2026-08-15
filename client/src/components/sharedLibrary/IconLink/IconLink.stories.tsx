import type { Meta, StoryObj } from '@storybook/react-vite';

import IconLink from './IconLink';
import GithubIcon from '../icons/GithubIcon';
import LinkedInIcon from '../icons/LinkedInIcon';
import MailIcon from '../icons/MailIcon';

const meta = {
  title: 'Components/IconLink',
  component: IconLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: { control: false },
  },
  args: {
    className: 'inline-flex items-center',
  },
} satisfies Meta<typeof IconLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GitHub: Story = {
  args: {
    href: 'https://github.com/b0rgbart3/',
    icon: GithubIcon,
    label: 'GitHub',
    external: true,
  },
};

export const LinkedIn: Story = {
  args: {
    href: 'https://www.linkedin.com/in/bart-dority/',
    icon: LinkedInIcon,
    label: 'LinkedIn',
    external: true,
  },
};

export const Email: Story = {
  args: {
    href: 'mailto:jobs4bart@gmail.com',
    icon: MailIcon,
    label: 'Email',
  },
};

export const ButtonVariant: Story = {
  args: {
    href: 'https://github.com/b0rgbart3/',
    icon: GithubIcon,
    label: 'GitHub',
    external: true,
    variant: 'button',
    iconSize: 20,
    // Overrides the meta-level default — the "button" variant already sets
    // its own display/alignment, so it shouldn't be combined with it.
    className: '',
  },
};
