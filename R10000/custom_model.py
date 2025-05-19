'''
This is a simple deterministic model that will be loaded as a .pickled object.

This assumes you have already fit your model to your training data and know the statistical parameters you want to set.

If you want to have MAMBA create your own model on the fly, then you MUST also include all of the associated
needs for the class (so fit, a cost function etc) as if you are running a custom ML model.

The custom class _must_ include the 'predict_proba' function, which accepts an array of scores 'X' and returns one of the two options below, but NOTE HOW THEY MUST BE lists within the array.

    1.  If you are using a more simplistic deterministic model, merely a predict_proba function that returns
    an array of length X in either of these formats:
    In this format, the entry is just the score from a deterministic model
    arr = [[1],
           [2]]

    OR

    2.  If you a returning a model that gives predicted probabilities of a match or other categories, give the 'match' probability first
    arr = [[.25,.75],
           [.75,.25]]

This is a really simple model built on simple data returning a deterministic model,so the predict_proba function
is just the addition of the two columns. You would then change the match threshold to whatever value you wanted.

For a more complicated logisitic regression class, see https://q-viper.github.io/2020/08/10/writing-a-logistic-regression-class-from-scratch/

When you Are done, use the 'pickle_custom_model.py' file to pickle the file which will format everything for how MAMBA needs it.
'''
import numpy as np


def score_func(vals):
    '''This will be applied to each column, just looping through the values calculating the rounded scores.'''
    return [1 if v > .9 else 0 for v in vals]

class deterministic_model:
    '''Define our inits'''
    def __init__(self):
        self.X: None
        self.y: None

    def predict_proba(X):
        '''
        This is the score generating function
        :param X: a matrix of scores.  Columns are 1) first_name, 2) last_name, 3) dob.  Logic is if the value presented is above .9, we give the value a 1, otherwise we give it a 0, then sum.
        Yes that isn't how record linkage actually works.
        :return: Array of scores with each row having its own _list_ of values.
        '''
        return [np.sum(i) for i in np.apply_along_axis(score_func, 0, X)]
