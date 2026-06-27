# ML

This folder is the boundary between **training** (done offline, by a human, in
Google Colab) and **inference** (done by the backend, automatically, in
production). The backend never trains anything — it only ever loads a finished
`.joblib` file.

```
ml/
├── notebooks/   Colab notebook(s) used to train the model(s)
└── models/      Exported .joblib artifacts — what the backend actually loads
```

## Workflow

1. Open/create a notebook in `notebooks/` (in Colab, or locally — it's just a
   `.ipynb` file either way).
2. Train the workout-recommendation model with scikit-learn.
3. Export it with `joblib.dump(model, "workout_recommender.joblib")`.
4. Download the file and place it in `models/workout_recommender.joblib`.
5. The backend loads it from the path configured by `ML_MODEL_PATH` in
   `backend/app/core/config.py` (defaults to this exact location).

Nothing here is built yet — this is just the agreed contract between training
and serving, set up now so the Machine Learning feature (built later, after
the rule-based workout generator) has a folder to drop its output into.
