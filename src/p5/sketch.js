import Interaction from './entities/interaction'

const sketch = (p) => {
  let interaction

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)
    interaction = new Interaction(p)
  }

  p.draw = () => {
    interaction.draw()
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
    interaction.windowResized()
  }

  p.updateWithProps = (props) => {
    if (props.phrase) {
      interaction.setPhrase(props.phrase)
    }
  }
}

export default sketch
