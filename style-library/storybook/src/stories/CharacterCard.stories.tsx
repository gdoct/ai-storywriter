import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCard, ThemeProvider, ThemeToggle } from '../../../ai-styles/src';

const meta: Meta<typeof CharacterCard> = {
  title: 'Components/CharacterCard',
  component: CharacterCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div style={{ width: '400px', padding: '2rem' }}>
          <ThemeToggle />
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    gender: {
      control: { type: 'select' },
      options: ['male', 'female', 'other'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'm', 'l', 'xl'],
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof CharacterCard>;

export const WithImage: Story = {
  args: {
    name: 'Elena Martinez',
    nickname: 'El',
    role: 'Detective',
    backstory: 'A seasoned detective with 15 years of experience in solving complex cases. Known for her analytical mind and unwavering determination.',
    notes: 'Has a photographic memory and speaks three languages fluently.',
    imageUrl: '/person.png',
    gender: 'female',
  },
};

export const WithGenderIconMale: Story = {
  args: {
    name: 'Marcus Thompson',
    nickname: 'Tank',
    role: 'Security Specialist',
    backstory: 'Former military officer turned private security consultant. Specializes in high-risk protection services.',
    notes: 'Expert in martial arts and tactical operations.',
    gender: 'male',
  },
};

export const WithGenderIconFemale: Story = {
  args: {
    name: 'Sarah Chen',
    role: 'Software Engineer',
    backstory: 'Brilliant programmer who specializes in artificial intelligence and machine learning algorithms.',
    notes: 'Published researcher with multiple patents in AI technology.',
    gender: 'female',
  },
};

export const WithGenderIconOther: Story = {
  args: {
    name: 'Alex Rivera',
    nickname: 'Ace',
    role: 'Freelance Journalist',
    backstory: 'Investigative journalist known for uncovering corruption in high places. Always chasing the next big story.',
    notes: 'Winner of three Pulitzer Prize nominations.',
    gender: 'other',
  },
};

export const Minimal: Story = {
  args: {
    name: 'John Doe',
  },
};

export const Clickable: Story = {
  args: {
    name: 'Maria Santos',
    role: 'Team Leader',
    backstory: 'Experienced project manager with a track record of successful team leadership.',
    notes: 'Certified in Agile and Scrum methodologies.',
    gender: 'female',
    onClick: () => alert('Character card clicked!'),
  },
};

export const LongContent: Story = {
  args: {
    name: 'Dr. Alexander Pemberton III',
    nickname: 'The Professor',
    role: 'Chief Research Scientist & Department Head',
    backstory: 'A renowned scientist with over 30 years of experience in quantum physics and theoretical mathematics. Has published over 200 research papers and holds multiple honorary doctorates from prestigious universities around the world. Known for his groundbreaking work in quantum entanglement theory.',
    notes: 'Speaks seven languages fluently, has a photographic memory, and maintains an extensive collection of rare scientific manuscripts. Despite his serious academic reputation, he has a secret passion for collecting vintage comic books and can often be found reading them during his lunch breaks.',
    gender: 'male',
  },
};

export const SmallSize: Story = {
  args: {
    name: 'Emma Wilson',
    role: 'Designer',
    backstory: 'Creative UI/UX designer with a passion for minimalist design.',
    gender: 'female',
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    name: 'David Rodriguez',
    nickname: 'Dave',
    role: 'Senior Developer',
    backstory: 'Full-stack developer with expertise in modern web technologies and cloud architecture.',
    notes: 'Certified AWS Solutions Architect.',
    gender: 'male',
    size: 'l',
  },
};

export const ExtraLargeSize: Story = {
  args: {
    name: 'Victoria Sterling',
    nickname: 'Vic',
    role: 'CEO & Founder',
    backstory: 'Visionary entrepreneur who founded three successful tech startups. Known for her innovative approach to solving complex business problems.',
    notes: 'Featured on Forbes 30 Under 30 and recipient of the Innovation Leadership Award.',
    imageUrl: '/person.png',
    gender: 'female',
    size: 'xl',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3>Small</h3>
        <CharacterCard
          name="Small Card"
          role="Compact"
          backstory="This is a small sized character card."
          gender="other"
          size="sm"
        />
      </div>
      <div>
        <h3>Medium (Default)</h3>
        <CharacterCard
          name="Medium Card"
          role="Standard"
          backstory="This is a medium sized character card (default)."
          gender="other"
          size="m"
        />
      </div>
      <div>
        <h3>Large</h3>
        <CharacterCard
          name="Large Card"
          role="Expanded"
          backstory="This is a large sized character card with more visual presence."
          gender="other"
          size="l"
        />
      </div>
      <div>
        <h3>Extra Large</h3>
        <CharacterCard
          name="Extra Large Card"
          role="Prominent"
          backstory="This is an extra large sized character card for maximum impact."
          gender="other"
          size="xl"
        />
      </div>
    </div>
  ),
};