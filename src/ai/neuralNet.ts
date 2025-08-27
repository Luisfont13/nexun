// Red neuronal avanzada para el bot
import * as tf from '@tensorflow/tfjs';

export class NeuralNet {
  private model: tf.Sequential;

  constructor() {
    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [10] }));
    this.model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));
    this.model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
  }

  async train(x: number[][], y: number[][]) {
    await this.model.fit(tf.tensor2d(x), tf.tensor2d(y), { epochs: 10 });
  }

  predict(input: number[]): number[] {
    const output = this.model.predict(tf.tensor2d([input])) as tf.Tensor;
    return Array.from(output.dataSync());
  }
}
