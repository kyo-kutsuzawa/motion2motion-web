# Motion-to-Motion

## Development

### Build javascript codes
```
$ npm run build
```

### Dataset generation
```
$ python nn/generate_dataset.py --out dataset/train/      --n-data 500
$ python nn/generate_dataset.py --out dataset/validation/ --n-data 64
$ python nn/generate_dataset.py --out dataset/test/       --n-data 50
```

### Training
```
$ python nn/train.py
```

### Model conversion to tensorflow.js
```
$ tensorflowjs_converter --input_format keras result/enc_100.h5 result/enc
$ tensorflowjs_converter --input_format keras result/dec_100.h5 result/dec
```
