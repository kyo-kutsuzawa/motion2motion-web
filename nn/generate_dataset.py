import numpy as np
from scipy import interpolate


def generate():
    import os
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--n-data", type=int, default=500, help="Number of trajectories.")
    parser.add_argument("--len", type=int, default=20, help="Time-series length i.e., number of samples in a trajectory.")
    parser.add_argument("--out", default="dataset/train/", help="Output directory.")
    parser.add_argument("--noplot", dest="plot", action="store_false")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.out), exist_ok=True)

    dataset = []

    for i in range(args.n_data):
        # Setup control points
        c = np.random.uniform(-1, 1, size=(3, 5))

        # Generate a Bezier curve
        t = np.linspace(0, 1, args.len)
        fx, _ = interpolate.splprep(c, k=2)
        data = interpolate.splev(t, fx)

        # Adjust the shape and offset
        data = np.array(data).T
        data -= data[0, :]

        # Save the trajectory
        filename = "{:0>5}.csv".format(i)
        savedir = os.path.join(args.out, filename)
        np.savetxt(savedir, data, delimiter=",")

        dataset.append(data)

    # Plot the dataset if specified
    if args.plot:
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d import axes3d

        fig1 = plt.figure()
        ax1  = fig1.add_subplot(1, 1, 1, projection="3d")
        fig2 = plt.figure()
        ax2_1 = fig2.add_subplot(3, 1, 1)
        ax2_2 = fig2.add_subplot(3, 1, 2)
        ax2_3 = fig2.add_subplot(3, 1, 3)

        for d in dataset[:10]:
            t = np.linspace(0, 1, args.len)

            ax1.plot(d[:, 0], d[:, 1], d[:, 2])
            ax2_1.plot(t, d[:, 0])
            ax2_2.plot(t, d[:, 1])
            ax2_3.plot(t, d[:, 2])

        fig1.savefig(os.path.join(args.out, "dataset.png"))
        plt.show()


if __name__ == "__main__":
    generate()
