import type { Meta, StoryObj } from '@storybook/react';
import { AiStoryReader, ThemeProvider, ThemeToggle } from '../../../ai-styles/src';

const meta: Meta<typeof AiStoryReader> = {
  title: 'Components/AiStoryReader',
  component: AiStoryReader,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}>
            <ThemeToggle />
          </div>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AiStoryReader>;

const longStoryText = `# Saltwater Bloom

The rain hammered against the corrugated iron roof of "The Mariner's Archive," Silas's bookshop, a relentless rhythm mirroring the ceaseless churn of the North Sea outside. He was hunched over a brittle 17th-century chart, painstakingly tracing a long-forgotten shipping route with a silverpoint pen, the scent of old paper and beeswax filling his small space. The shop wasn't booming; it rarely was. Mostly he attracted collectors from out of state, curious about local lore and the occasional tourist seeking a memento. Silas preferred the quiet solitude, the company of ghosts contained within the aging pages.

A chime announced a visitor, a sound that instantly tightened his muscles. He didn't bother looking up, assuming it was another collector with an unreasonable demand for authenticity. "Just a moment," he grunted, carefully capping the pen. When he finally turned, he found her standing in the doorway – a splash of vibrant color against the muted tones of the shop, a woman radiating a warmth that felt utterly alien to Seabrook's perpetual grey. She was tall, with fiery red hair pulled back in a loose braid and eyes the startling blue of a winter sky. A large canvas bag hung from her shoulder, bulging with art supplies.

"Hello," she said, her voice carrying a musical lilt that Silas couldn't quite place. "I'm Lyra. I was hoping you might be able to tell me a little about this town."

Silas blinked, momentarily caught off guard by the directness of her request and the genuine warmth in her expression. Most visitors came seeking specific items or information; few asked about the town itself with such obvious interest.

"What kind of information are you looking for?" he asked, setting the chart aside and giving her his full attention for the first time.

"I'm a marine biologist," Lyra explained, shifting the bag on her shoulder. "I'm here to study the algal blooms that have been occurring off the coast. But I'm also an artist, and I'm fascinated by how communities adapt to and interact with their marine environments. I was hoping to understand more about Seabrook's relationship with the sea."

The combination surprised him. Marine biologist and artist seemed like an unusual pairing, but as she spoke, her passion for both disciplines was evident. There was something infectious about her enthusiasm, something that made the dusty confines of his shop feel suddenly less claustrophobic.

"The sea has always been both provider and adversary here," Silas found himself saying, surprising himself with his willingness to engage. "The town was founded by fishermen in the 1800s, but the fishing industry collapsed decades ago when the cod disappeared. Now we're mostly retirees and summer tourists."

Lyra nodded thoughtfully, her eyes scanning the maritime artifacts scattered throughout the shop. "And the algal blooms? Have they always been part of the ecosystem here?"

"They've gotten worse in recent years," Silas admitted. "The old-timers say they've never seen anything like what we're experiencing now. The water turns red as blood, and the smell..." He trailed off, remembering the acrid stench that had plagued the town for weeks during the last major bloom.

"That's exactly what I'm here to study," Lyra said, her eyes lighting up. "The blooms are becoming more frequent and intense along this entire stretch of coast. I'm trying to understand the environmental factors that are contributing to the changes."

As she spoke, Silas found himself drawn into her passion for her work. She explained how rising sea temperatures, changes in nutrient runoff, and shifting ocean currents were creating perfect conditions for certain species of algae to flourish in unprecedented numbers. What struck him most was how she spoke about the ocean – not as something separate from human experience, but as an interconnected system where everything influenced everything else.

"I'd love to set up a monitoring station near the harbor," she said. "But I also want to document how the community is responding to these changes. The intersection of science and human experience, if you will."

"You should talk to Martha Henley," Silas suggested. "She's lived here her whole life, and her family has been fishing these waters for four generations. She might have insights that you won't find in any scientific journal."

Lyra's face brightened. "That would be wonderful. Do you think she'd be willing to speak with me?"

"I could introduce you," Silas offered, then immediately wondered what had possessed him to make such a suggestion. He typically avoided social interactions beyond the necessary transactions of his business.

"I'd really appreciate that," Lyra said warmly. "And perhaps... would you mind if I sketched in here sometime? The shop has such wonderful character, and I'd love to capture the relationship between the maritime artifacts and the modern town outside."

Silas felt a flutter of something he couldn't quite identify – pleasure, perhaps, or simply surprise at being seen and valued by someone who seemed to understand the quiet beauty he'd tried to preserve in his small corner of the world.

"You're welcome anytime," he said, meaning it.

Over the following weeks, Lyra became a regular presence in both the shop and the town. She set up her monitoring equipment at the harbor, taking daily measurements of water temperature, salinity, and algae concentrations. But she also spent hours talking with residents, sketching the harbor at different times of day, and documenting the subtle ways the blooms were affecting daily life in Seabrook.

Silas found himself looking forward to her visits with an anticipation that surprised him. She would arrive in the afternoons, usually after spending the morning at the harbor, and set up her easel near the window where the light was best. As she sketched, she would share what she'd learned that day – both from her scientific observations and from her conversations with townspeople.

"Martha told me something fascinating today," Lyra said one afternoon, her pencil moving in sure strokes across the paper. "She said her grandfather used to predict weather patterns by watching the color of the water near the point. Apparently, certain subtle changes in hue would tell him when storms were coming days in advance."

"Traditional ecological knowledge," Silas murmured, familiar with the concept from his reading but amazed to hear it applied so specifically to their local waters.

"Exactly. And it got me thinking about how much we might be missing by relying solely on modern instruments. These communities have been observing marine systems for generations. Their knowledge could be invaluable for understanding long-term patterns."

As she spoke, Silas realized he was witnessing something remarkable – a scientist who valued both empirical data and traditional wisdom, an artist who saw beauty in the intersection of human and natural systems. Her presence was transforming not just his shop, but his understanding of the place he'd called home for so many years.

The algal blooms that summer were particularly severe. The water turned a deep rust color that stretched from the harbor to the horizon, and the smell of decaying algae permeated the entire town. Tourist bookings plummeted, and the few remaining fishing boats stayed in port. For most residents, it was simply another hardship in a long series of challenges facing their community.

But Lyra saw something different. Her daily measurements revealed patterns in the bloom's development and distribution that had never been documented before. More importantly, her conversations with residents uncovered a wealth of observational data going back decades – subtle changes in water color, shifts in marine life behavior, and correlations with weather patterns that no scientific study had ever captured.

"I think we're witnessing a fundamental shift in this marine ecosystem," she told Silas one evening as they walked along the harbor. The setting sun turned the algae-red water into a molten mirror, beautiful and ominous at the same time. "But it's not just an environmental story. It's a human story too – about adaptation, resilience, and the deep connections between communities and their natural environments."

Silas looked out at the transformed seascape, seeing it through her eyes for the first time. What had always seemed like decline and deterioration suddenly appeared more complex – a system in transition, challenging but not necessarily hopeless.

"What will you do with all this information?" he asked.

"Write about it, obviously," she said, then smiled. "But I'm also planning an exhibition that combines the scientific data with artwork and oral histories from the community. I want to show how environmental change is experienced at the human scale, in places like Seabrook."

That evening, as they stood watching the sunset paint the troubled waters in shades of gold and crimson, Silas realized that Lyra had given him something he hadn't known he'd lost – a sense of connection to the place he called home, and an understanding that even in the face of environmental challenges, there was still beauty and meaning to be found in the relationship between people and the sea.

The algal bloom would eventually subside, as it always did. But the connections Lyra had helped forge – between science and traditional knowledge, between individual experience and larger environmental patterns, between a reclusive bookshop owner and his community – would endure long after the waters cleared.`;

const sampleCharacters = [
  {
    id: '1',
    name: 'Silas',
    alias: 'The Keeper of Stories',
    role: 'Bookshop Owner',
    gender: 'Male',
    appearance: 'A quiet man in his forties with weathered hands and kind eyes, usually found surrounded by old maritime books and charts.',
    backstory: 'Silas inherited the bookshop from his uncle and has spent years preserving the maritime history of Seabrook. He prefers solitude but finds himself drawn to stories of the sea.',
    extraInfo: 'Has an extensive collection of 17th-century nautical charts and specializes in local maritime folklore.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2', 
    name: 'Lyra',
    alias: 'The Sea Scientist',
    role: 'Marine Biologist & Artist',
    gender: 'Female',
    appearance: 'Tall with fiery red hair in a loose braid and striking blue eyes. Always carries art supplies and scientific instruments.',
    backstory: 'A passionate marine biologist studying algal blooms, who also captures the beauty of coastal ecosystems through her artwork. She believes in combining scientific data with traditional knowledge.',
    extraInfo: 'Working on an exhibition that combines environmental data with community stories and artwork.',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b043?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Martha Henley',
    alias: 'The Memory Keeper',
    role: 'Local Elder & Fisherman\'s Daughter',
    gender: 'Female',
    appearance: 'An elderly woman with silver hair and sharp eyes that have watched the sea change over decades.',
    backstory: 'Born and raised in Seabrook, Martha comes from four generations of fishermen. She holds invaluable traditional knowledge about the ocean\'s patterns and changes.',
    extraInfo: 'Can predict weather patterns by reading subtle changes in water color, a skill passed down from her grandfather.',
    image: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&h=150&fit=crop&crop=face'
  }
];

const coverImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop';

export const SpaceMaximizingDefault: Story = {
  name: 'Space-Maximizing Reader',
  args: {
    text: longStoryText,
    title: 'Saltwater Bloom',
    author: 'Marina Chen',
    readingTime: 12,
    coverImage,
    characters: sampleCharacters,
    enableTTS: true,
    enableBookmark: true,
    enableHighlight: true,
    enableFullScreen: true,
    onProgressChange: (progress) => console.log('Progress:', progress),
    onBookmark: (bookmark) => console.log('Bookmark:', bookmark),
    onHighlight: (selection) => console.log('Highlight:', selection),
    onSettingsChange: (settings) => console.log('Settings:', settings),
    onModeChange: (mode) => console.log('Mode changed:', mode),
    onDownload: () => console.log('Download requested'),
    onClose: () => console.log('Reader closed'),
  },
};

export const FullScreenMode: Story = {
  name: 'Full-Screen Experience',
  args: {
    ...SpaceMaximizingDefault.args,
    title: 'Immersive Reading Experience',
  },
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark">
        <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export const ModalWithHero: Story = {
  name: 'Modal with Hero Section',
  args: {
    text: longStoryText,
    title: 'Saltwater Bloom',
    author: 'Marina Chen',
    readingTime: 12,
    coverImage,
    characters: sampleCharacters,
    isModal: true,
    enableTTS: true,
    enableBookmark: true,
    enableHighlight: true,
    enableFullScreen: true,
    onDownload: () => console.log('Download requested'),
    onClose: () => console.log('Reader closed'),
  },
};

export const CollapsedHero: Story = {
  name: 'Compact Interface',
  args: {
    text: longStoryText,
    title: 'Saltwater Bloom',
    author: 'Marina Chen',
    readingTime: 12,
    characters: sampleCharacters.slice(0, 2), // Fewer characters for compact view
    enableTTS: true,
    enableBookmark: true,
    enableFullScreen: true,
    onDownload: () => console.log('Download requested'),
    onClose: () => console.log('Reader closed'),
  },
};

export const NoVisualContent: Story = {
  name: 'Text-Only Story',
  args: {
    text: longStoryText,
    title: 'Saltwater Bloom',
    author: 'Marina Chen',
    readingTime: 12,
    enableTTS: true,
    enableBookmark: true,
    enableHighlight: true,
    enableFullScreen: true,
    onSettingsChange: (settings) => console.log('Settings:', settings),
    onModeChange: (mode) => console.log('Mode changed:', mode),
  },
};

export const MobileOptimized: Story = {
  name: 'Mobile Experience',
  args: {
    ...SpaceMaximizingDefault.args,
  },
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div style={{ width: '375px', height: '667px', border: '1px solid #ccc', margin: '0 auto' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

// Legacy stories for backward compatibility
export const Default: Story = {
  args: {
    text: longStoryText.slice(0, 500) + '...',
    title: 'The Tale of AiStoryReader',
    author: 'Component Chronicles',
    readingTime: 2,
  },
};

export const WithBookmarking: Story = {
  args: {
    text: longStoryText.slice(0, 500) + '...',
    title: 'Interactive Story',
    enableBookmark: true,
    enableHighlight: true,
    onBookmark: (bookmark) => console.log('Bookmark created:', bookmark),
    onHighlight: (selection) => console.log('Text highlighted:', selection),
  },
};

export const PaginatedMode: Story = {
  args: {
    text: longStoryText.slice(0, 500) + '...',
    title: 'Paginated Story',
    displayMode: 'paginated',
    enableTTS: true,
  },
};

export const PreviewMode: Story = {
  args: {
    text: longStoryText,
    title: 'Story Preview',
    displayMode: 'preview',
    author: 'Preview Author',
    readingTime: 3,
  },
};