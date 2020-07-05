import tensorflow as tf
from tensorflow.keras import layers
import argparse
import os
from train import load_dataset


parser = argparse.ArgumentParser(description="Example of training")
parser.add_argument("--latent-dim", type=int, default=8, help="Number of latent-space dimensions.")
parser.add_argument("--n-units", type=int, default=64, help="Number of hidden units.")
args = parser.parse_args()

# Setup a neural network
out_dim = 3  # Output dimension

enc = tf.keras.Sequential([
    layers.LSTM(args.n_units, batch_input_shape=[1, 20, 3]),
    layers.Dense(args.latent_dim)
])

dec = tf.keras.Sequential([
    layers.LSTM(args.n_units, batch_input_shape=[1, 1, 3+args.latent_dim], stateful=True),
    layers.Dense(out_dim)
])

val_dataset = tf.data.Dataset.from_tensor_slices(load_dataset("dataset/validation"))
val_dataset = val_dataset.repeat(1)
val_dataset = val_dataset.batch(1)

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

    break

enc.load_weights("result/enc_100.h5")
dec.load_weights("result/dec_100.h5")

enc.save(os.path.join("result/", "enc2_100.h5"))
dec.save(os.path.join("result/", "dec2_100.h5"))
