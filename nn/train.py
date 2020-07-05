#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import tensorflow as tf
from tensorflow.keras import layers
import numpy as np
import os

# Disable warning
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'


def train():
    import argparse

    # By using `argparse` module, you can specify parameters as command-line arguments.
    parser = argparse.ArgumentParser(description="Example of training")
    parser.add_argument("--dataset-train", type=str, default="dataset/train/", help="Training dataset.")
    parser.add_argument("--dataset-validation", type=str, default="dataset/validation/", help="Validation dataset.")
    parser.add_argument("--epochs", type=int, default=100, help="Number of training epochs.")
    parser.add_argument("--batchsize", type=int, default=64, help="Mini-batch size.")
    parser.add_argument("--latent-dim", type=int, default=8, help="Number of latent-space dimensions.")
    parser.add_argument("--n-units", type=int, default=64, help="Number of hidden units.")
    parser.add_argument("--out", default="result", help="Output directory.")
    args = parser.parse_args()

    # Setup a neural network
    out_dim = 3  # Output dimension

    enc = tf.keras.Sequential([
        layers.LSTM(args.n_units),
        layers.Dense(args.latent_dim)
    ])

    dec = tf.keras.Sequential([
        layers.LSTM(args.n_units, stateful=True),
        layers.Dense(out_dim)
    ])

    # Setup an optimizer.
    optimizer = tf.keras.optimizers.Adam()

    # Load a training dataset and validation dataset
    train_dataset = tf.data.Dataset.from_tensor_slices(load_dataset(args.dataset_train))
    train_dataset = train_dataset.repeat(1)
    train_dataset = train_dataset.shuffle(1000)
    train_dataset = train_dataset.batch(args.batchsize, drop_remainder=True)
    val_dataset = tf.data.Dataset.from_tensor_slices(load_dataset(args.dataset_validation))
    val_dataset = val_dataset.repeat(1)
    val_dataset = val_dataset.batch(args.batchsize, drop_remainder=True)

    for epoch in range(1, args.epochs + 1):
        # Training
        train_loss = 0.0

        for i, data in enumerate(train_dataset):
            with tf.GradientTape(persistent=True) as tape:
                # Encoding
                z = enc(data)

                # Decoding
                y = []
                yt = data[:, 0, :]
                for _ in range(data.shape[1]):
                    dec_in = tf.concat((yt, z), 1)
                    dec_in = tf.reshape(dec_in, shape=(dec_in.shape[0], 1, dec_in.shape[1]))
                    yt = dec(dec_in)
                    y.append(yt)
                y = tf.stack(y, axis=1)

                # Calculate the training loss
                loss = tf.reduce_mean(tf.square(y[:, :-1, :] - data[:, 1:, :]))

            # Update the parameters
            grads_enc = tape.gradient(loss, enc.trainable_variables)
            grads_dec = tape.gradient(loss, dec.trainable_variables)
            optimizer.apply_gradients(zip(grads_enc, enc.trainable_variables))
            optimizer.apply_gradients(zip(grads_dec, dec.trainable_variables))
            del tape

            # Reset decoder states
            dec.reset_states()

            # Print a result
            print("Epoch[{}] Loss: {:.5f}".format(epoch, loss), end="\r")

            # Accumulate training losses
            train_loss += loss.numpy()

        # Print training results
        avg_train_loss = train_loss/((i+1)*args.batchsize)
        print("Training Results   - Epoch: {:3d}  Avg loss: {:.5f}".format(epoch, avg_train_loss))

        # Validation
        val_loss = 0.0
        for i, data in enumerate(val_dataset):
            # Encoding
            z = enc(data)

            # Decoding
            y = []
            yt = data[:, 0, :]
            for _ in range(data.shape[1]):
                dec_in = tf.concat((yt, z), 1)
                dec_in = tf.reshape(dec_in, shape=(dec_in.shape[0], 1, dec_in.shape[1]))
                yt = dec(dec_in)
                y.append(yt)
            y = tf.stack(y, axis=1)

            # Calculate the validation loss
            loss = tf.reduce_mean(tf.square(y[:, :-1, :] - data[:, 1:, :]))

            # Reset decoder states
            dec.reset_states()

            # Accumulate the validation loss
            val_loss += loss.numpy()

        # Record the validation results
        avg_val_loss = val_loss/((i+1)*args.batchsize)
        print("Validation Results - Epoch: {:3d}  Avg loss: {:.5f}".format(epoch, avg_val_loss))

        # Save the trained model
        if epoch % 20 == 0:
            enc.save(os.path.join(args.out, "enc_{}.h5".format(epoch)))
            dec.save(os.path.join(args.out, "dec_{}.h5".format(epoch)))


def load_dataset(dirname):
    """Load a dataset.

    This example assume that the dataset is a csv file.
    In this example, the first three columns are inputs,
    and the next three columns are ground-truth outputs.
    """
    import os
    import glob

    filelist = glob.glob(os.path.join(dirname, "*.csv"))

    dataset = []
    for filename in filelist:
        data = np.loadtxt(filename, delimiter=",", dtype=np.float32)
        dataset.append(data)

    return dataset


if __name__ == "__main__":
    train()
