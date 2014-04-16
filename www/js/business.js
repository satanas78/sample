String.prototype.format = function (args) {
    var newStr = this;
    for (var key in args) {
        newStr = newStr.replace('{' + key + '}', args[key]);
    }
    return newStr;
}

var Serie = function (item) {
    this.title = item.title;
    this.longDescription = item.longDescription;
    this.posterURL = item.posterURL;

    this.getPoster = function () {
        setTimeout(function () { return this.posterURL; }, 500);
    }
};

var EverStreamViewModel = function () {
    var self = this;

    // type de la page en cours d'affichage :
    // top detail searchresult ...
    this.pageType = ko.observable('top');

    this.pageStack = ko.observableArray();

    this.currentPage = ko.computed(function () {
        return self.pageStack().slice(0)[0];
    }, this);
    this.pageStack.unshift('top'); // .push('top');

    // liste top
    this.topserie = ko.observableArray([]);

    // liste série chargées pendant la session
    this.series = ko.observableArray([]);

    // série en cours
    this.serie = ko.observable({ title: 'sample', longDescription: 'sample description', posterURL: '' });

    // liste des épisodes de la série en cours
    this.episodes = ko.observableArray([]);

    // liste des saisons
    this.seasons = ko.observableArray([]);

    this.currentSerie = ko.observable({
        nbVF: 0,
        nbVOSTFR: 11,
        nbVO: 5,
        seasons: []
    });

    this.currentSerieSeasons = ko.observableArray([]);

    this.currentSeasonEpisodes = ko.observableArray([]);
    this.currentSeasonEpisodesIdx = ko.observable(-1);

    this.currentSerieHistory = ko.observable({season: '-'});

    this.currentSerieHistory.subscribe( function( selectedSeason )
    {
       // extraire la liste des épisodes disponibles pour cette saison
        self.currentSeasonEpisodesIdx(-1);
        self.currentSeasonEpisodes([]);
        $.each( self.episodes(), function( index, item ) {
           if( item.season == selectedSeason.season )
           {
               self.currentSeasonEpisodes.push( item );
           }
        });
        if( self.currentSeasonEpisodes().length > 0 )
            self.currentSeasonEpisodesIdx(0);
    });

    // chargement de la liste des top séries
    // depuis le serveur ou depuis le localstorage
    this.loadTopSeries = function () {
        //alert('load top');
        var key = "topseries";
        //localStorage.removeItem(key);
        var item = localStorage.getItem(key);
        if (item == null) {
			$.ajax(
			{
				dataType: "json",
				url: topserieUrl,
				success: function (datas) {
					localStorage.setItem(key, JSON.stringify(datas));
					self.topserie(datas.TopSeries);
					self.series(datas.Series);
				},
				error: function() {
					// TODO - Traitement des erreurs serveur
					alert( "loadTopSeries error" );
				}
			});
			/***********
            $.getJSON(topserieUrl, function (datas) {
                // alert('top loaded');
                localStorage.setItem(key, JSON.stringify(datas));
                self.topserie(datas.TopSeries);
                self.series(datas.Series);
            });
			*******/
        }
        else {
            // alert('top in cache');
            var datas = JSON.parse(item);
            self.topserie(datas.TopSeries);
            self.series(datas.Series);
        }
    };

    //--------------------------------------------------
    // Chargement de la liste des épisodes d'une série
    //--------------------------------------------------
    this.loadEpisodeList = function ( serie ) {

        var key = "episodes_" + serie.serieId;
        //this.clearCache( key );
        var item = this.getCache(key);
        if (item == null) {
            $.getJSON(getEpisodesURL.format({ id: serie.serieId }), function (result) {
                self.storeCache( key, result );
                self.setEpisodeList( result );
                self.initSeasons( serie );
            });
        }
        else
        {
            self.setEpisodeList( item );
            self.initSeasons( serie );
        }


    };

    this.setEpisodeList = function( value )
    {
        $.each(value.Episodes, function (index, item) {

            if ($.inArray(item.season, self.currentSerieSeasons()) == -1) {
                console.log('season:' + item.season);
                self.currentSerieSeasons.push(item.season);
            }
        });
        self.episodes(value.Episodes);
    };

    //-------------------------------------------------
    // Initialisation des saisons de la série en cours
    // (lors de la sélection de la série)
    //-------------------------------------------------
    this.initSeasons = function( serie )
    {
        // est-ce qu'il y as un épisode en cours de visu ou récemment visualisé ?
        var key = "history_" + serie.serieId;
        var item = self.getCache( key );
        if( item == null )
        {
            item =
            {
                season: self.currentSerieSeasons()[0]
            };
        }
        self.currentSerieHistory( item );
    };

    //----------------------------------
    // Sélection de la saison suivante
    //----------------------------------
	this.seasonNext = function()
	{
		console.log( 'next');
		var idx = self.currentSerieSeasons.indexOf( self.currentSerieHistory().season );
		console.log( 'idx=' + idx);
		if( idx >= 0 && idx < self.currentSerieSeasons().length-1 )
		{
		console.log( 'ok' );
			idx++;
			var item = {
                season: self.currentSerieSeasons()[idx]
            };
			self.currentSerieHistory( item );	
		}
	}
    //------------------------------------
    // Sélection de la saison précédente
    //------------------------------------
    this.seasonPrev = function()
    {
        console.log( 'prev');
        var idx = self.currentSerieSeasons.indexOf( self.currentSerieHistory().season );
        console.log( 'idx=' + idx);
        if( idx > 0 )
        {
            console.log( 'ok' );
            idx--;
            var item = {
                season: self.currentSerieSeasons()[idx]
            };
            self.currentSerieHistory( item );
        }
    }

    this.loadStreams = function (episode) {

    };

    this.onSerieClick = function (target) {
        // rechercher si la série est déja chargée en mémoire
        var match = ko.utils.arrayFirst(self.series(), function (item) { return item.id == target.serieId; });
        if (match) {
            // alert("found :" + match.title);
            self.currentSerieHistory({season: '?'});
            self.currentSerieSeasons([]);
            self.episodes([]);

            self.loadEpisodeList(target);
            self.serie(match);
            self.pageStack.unshift('serie');
        }
    };

    // fonctions de navigation
    this.prevPage = function () {
        self.pageStack.shift(); //  ('top');
    };

    this.loadTopSeries();
    //alert( this.pageStack()[0] );

    //=======================
    // PROGRESS BAR BINDINGS
    //=======================
    this.progressMax = ko.observable(100);
    this.progressCurrent = ko.observable(70);


    //=======================
    // GESTION DU CACHE
    //=======================
    this.getCache = function( key )
    {
        var item = localStorage.getItem( key );
        return JSON.parse(item)
    };
    this.storeCache = function( key, value )
    {
        localStorage.setItem( key, JSON.stringify(value) );
    };
    this.clearCache = function( key )
    {
        localStorage.removeItem( key );
    };

};

//var viewModel = new EverStreamViewModel();
//ko.applyBindings(viewModel);